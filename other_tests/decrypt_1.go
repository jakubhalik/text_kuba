package main

import (
	"bufio"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"io"
	"strings"
	"crypto"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"golang.org/x/crypto/openpgp/packet"
	"golang.org/x/term"
)

func main() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter your new username: ")
	newUsername, _ := reader.ReadString('\n')
	newUsername = strings.TrimSpace(newUsername)
	
	fmt.Print("Enter password for 'postgres' user: ")
	postgresPasswordBytes, _ := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println() 
	postgresPassword := strings.TrimSpace(string(postgresPasswordBytes))

	fmt.Print("Enter password for '" + newUsername + "' user: ")
	newUserPasswordBytes, _ := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println() 
	newUserPassword := strings.TrimSpace(string(newUserPasswordBytes))

	combinedPassword := newUsername + newUserPassword
	hashedPassword := hashPassword(combinedPassword)

	combinedPostgresPassword := "postgres" + postgresPassword
	postgresHashedPassword := hashPassword(combinedPostgresPassword)

	entity, err := generatePGPKeys(newUsername)
	if err != nil {
		log.Fatalf("Failed to generate PGP keys: %v", err)
	}

	publicKey, err := exportPublicKey(entity)
	if err != nil {
		log.Fatalf("Failed to export public key: %v", err)
	}

	privateKey, err := exportPrivateKey(entity)
	if err != nil {
		log.Fatalf("Failed to export private key: %v", err)
	}

	fmt.Println("Generated PGP Keys:")
	fmt.Println("Public Key:")
	fmt.Println(publicKey)
	fmt.Println("Private Key:")
	fmt.Println(privateKey)

	testMessage := "This is a test message."

	pgpEncryptedMessage, err := encryptMessage(entity, testMessage)
	if err != nil {
		log.Fatalf("Failed to encrypt the message with PGP: %v", err)
	}
	fmt.Println("PGP Encrypted Message:")
	fmt.Println(pgpEncryptedMessage)

	var symEncryptedMessage string
	connStr := fmt.Sprintf("user=postgres password=%s dbname=text_kuba sslmode=disable", postgresPassword)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	err = db.QueryRow(`
		SELECT pgp_sym_encrypt($1, $2);`,
		pgpEncryptedMessage, hashedPassword).Scan(&symEncryptedMessage)
	if err != nil {
		log.Fatalf("Failed to symmetrically encrypt the PGP message: %v", err)
	}
	fmt.Println("Symmetrically Encrypted Message:")
	fmt.Println(symEncryptedMessage)

	_, err = db.Exec(fmt.Sprintf(`CREATE ROLE "%s" WITH LOGIN PASSWORD '%s';`, newUsername, newUserPassword))
	if err != nil {
		log.Fatalf("Failed to create role: %v", err)
	}

	_, err = db.Exec(fmt.Sprintf(`CREATE SCHEMA IF NOT EXISTS "%s_schema" AUTHORIZATION "%s";`, newUsername, newUsername))
	if err != nil {
		log.Fatalf("Failed to create schema: %v", err)
	}

	_, err = db.Exec(fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS "%s_schema".encryption_test (
			id SERIAL PRIMARY KEY,
			encrypted_message BYTEA
		);`, newUsername))
	if err != nil {
		log.Fatalf("Failed to create encryption_test table: %v", err)
	}

	_, err = db.Exec(`CREATE SCHEMA IF NOT EXISTS postgres_schema;`)
	if err != nil {
		log.Fatalf("Failed to create postgres_schema: %v", err)
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS postgres_schema.public_keys (
		username TEXT PRIMARY KEY,
		public_key TEXT NOT NULL
	);`)
	if err != nil {
		log.Fatalf("Failed to create public_keys table: %v", err)
	}

	_, err = db.Exec(fmt.Sprintf(`
		INSERT INTO "postgres_schema"."public_keys" (username, public_key) 
		VALUES ($1, pgp_sym_encrypt($2, $3));
	`), newUsername, publicKey, postgresHashedPassword)
	if err != nil {
		log.Fatalf("Failed to insert public key: %v", err)
	}

	_, err = db.Exec(fmt.Sprintf(`
		INSERT INTO "%s_schema".encryption_test (encrypted_message)
		VALUES ($1);`,
	newUsername), symEncryptedMessage)
	if err != nil {
		log.Fatalf("Failed to insert encrypted message into PostgreSQL: %v", err)
	}
	
	var selectedPublicKey string
	err = db.QueryRow(`
		SELECT pgp_sym_decrypt(public_key::bytea, $1) 
			AS public_key FROM postgres_schema.public_keys 
				WHERE username = $2;`,
	postgresHashedPassword, newUsername).Scan(&selectedPublicKey)
	if err != nil {
		log.Fatalf("Failed to select public key of the %s: %v", newUsername, err)
	}
	
	var selectedEncryptedMessage []byte
	query := fmt.Sprintf(`SELECT encrypted_message FROM "%s_schema".encryption_test LIMIT 1;`, newUsername)
	err = db.QueryRow(query).Scan(&selectedEncryptedMessage)
	if err != nil {
		log.Fatalf("Failed to select the encryptedMessage: %v", err)
	}
	fmt.Println("Retrieved encrypted message:")
	fmt.Println(selectedEncryptedMessage)

	var pgpDecryptedMessage string
	err = db.QueryRow(`
		SELECT pgp_sym_decrypt($1::bytea, $2);`,
		selectedEncryptedMessage, hashedPassword).Scan(&pgpDecryptedMessage)
	if err != nil {
		log.Fatalf("Failed to symmetrically decrypt the message: %v", err)
	}
	fmt.Println("Symmetrically Decrypted Message:")
	fmt.Println(pgpDecryptedMessage)

	decryptedMessage, err := decryptMessage(entity, pgpDecryptedMessage)
	if err != nil {
		log.Fatalf("Failed to decrypt the PGP message: %v", err)
	}
	fmt.Println("Final Decrypted Message:")
	fmt.Println(decryptedMessage)

	fmt.Println("Encryption test completed and results saved in the PostgreSQL database.")
}

func hashPassword(password string) string {
	hashed := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hashed[:])
}

func generatePGPKeys(name string) (*openpgp.Entity, error) {
	config := &packet.Config{
		RSABits:  2048,
		DefaultHash: crypto.SHA256,
	}
	entity, err := openpgp.NewEntity(name, "", "", config)
	if err != nil {
		return nil, err
	}
	return entity, nil
}

func exportPublicKey(entity *openpgp.Entity) (string, error) {
	var publicKeyBuf strings.Builder
	w, err := armor.Encode(&publicKeyBuf, openpgp.PublicKeyType, nil)
	if err != nil {
		return "", err
	}
	defer w.Close()

	err = entity.Serialize(w)
	if err != nil {
		return "", err
	}

	return publicKeyBuf.String(), nil
}

func exportPrivateKey(entity *openpgp.Entity) (string, error) {
	var privateKeyBuf strings.Builder
	w, err := armor.Encode(&privateKeyBuf, openpgp.PrivateKeyType, nil)
	if err != nil {
		return "", err
	}
	defer w.Close()

	err = entity.SerializePrivate(w, nil)
	if err != nil {
		return "", err
	}

	return privateKeyBuf.String(), nil
}

func encryptMessage(entity *openpgp.Entity, message string) (string, error) {
	var encryptedBuf strings.Builder
	w, err := armor.Encode(&encryptedBuf, "PGP MESSAGE", nil)
	if err != nil {
		return "", err
	}
	defer w.Close()

	pt, err := openpgp.Encrypt(w, []*openpgp.Entity{entity}, nil, nil, &packet.Config{DefaultHash: crypto.SHA256})
	if err != nil {
		return "", err
	}

	_, err = pt.Write([]byte(message))
	if err != nil {
		return "", err
	}

	pt.Close()
	w.Close()

	return encryptedBuf.String(), nil
}

func decryptMessage(entity *openpgp.Entity, encryptedMessage string) (string, error) {
	fmt.Println("Starting decryption...")
	fmt.Println("Encrypted Message:")
	fmt.Println(encryptedMessage)

	armorBlock, err := armor.Decode(strings.NewReader(encryptedMessage))
	if err != nil {
		fmt.Println("Failed to decode armor block:", err)
		return "", err
	}

	fmt.Println("Armor block decoded successfully.")

	md, err := openpgp.ReadMessage(armorBlock.Body, openpgp.EntityList{entity}, nil, nil)
	if err != nil {
		fmt.Println("Failed to read PGP message:", err)
		return "", err
	}

	fmt.Println("PGP message read successfully.")

	decryptedBytes, err := io.ReadAll(md.UnverifiedBody)
	if err != nil {
		fmt.Println("Failed to read unverified body:", err)
		return "", err
	}

	fmt.Println("Decrypted bytes read successfully.")

	decryptedMessage := string(decryptedBytes)
	fmt.Println("Decrypted Message:", decryptedMessage)

	return decryptedMessage, nil
}

