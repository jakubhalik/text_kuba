package main

import (
	"bufio"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"time"
	"os/exec"
	"strings"
	"crypto"
	"golang.org/x/term"
	_ "github.com/lib/pq"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"golang.org/x/crypto/openpgp/packet"
)

var sudoPassword string

func main() {
	log.Println("Starting the setup process...")

	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Would you like to load configuration from .env file? (y/n): ")
	useEnv, _ := reader.ReadString('\n')
	useEnv = strings.TrimSpace(useEnv)

	var username, postgresPassword, userPassword string

	if strings.ToLower(useEnv) == "y" {
		log.Println("Loading configuration from .env file.")
		err := godotenv.Load()
		if err != nil {
			log.Fatalf("Error loading .env file: %v", err)
		}

		username = os.Getenv("owner")
		if username == "" {
			log.Fatal("NAME not found in .env file")
		}

		postgresPassword = os.Getenv("postgres_password")
		if postgresPassword == "" {
			log.Fatal("POSTGRES_PASSWORD not found in .env file")
		}

		userPassword = os.Getenv("owner_password")
		if userPassword == "" {
			log.Fatal("USER_PASSWORD not found in .env file")
		}

		log.Printf("Configuration loaded for user: %s", username)
	} else {
		fmt.Print("Enter your name/alias: ")
		username, _ = reader.ReadString('\n')
		username = strings.TrimSpace(username)
		log.Printf("Username entered: %s", username)

		fmt.Print("Enter password for the 'postgres' user: ")
		postgresPasswordBytes, _ := term.ReadPassword(int(os.Stdin.Fd()))
		fmt.Println()
		postgresPassword = strings.TrimSpace(string(postgresPasswordBytes))
		log.Println("Password for 'postgres' user entered.")

		fmt.Print("Enter password for '" + username + "' user: ")
		userPasswordBytes, _ := term.ReadPassword(int(os.Stdin.Fd()))
		fmt.Println()
		userPassword = strings.TrimSpace(string(userPasswordBytes))
		log.Println("Password for user entered.")
	}

	fmt.Print("Enter your sudo password: ")
	sudoPasswordBytes, _ := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println()
	sudoPassword = strings.TrimSpace(string(sudoPasswordBytes))
	log.Println("Sudo password entered.")

	combinedPassword := username + userPassword
	hashedPassword := hashPassword(combinedPassword)
	log.Printf("Hashed password for '%s': %s", username, hashedPassword)

	combinedPostgresPassword := "postgres" + postgresPassword
	postgresHashedPassword := hashPassword(combinedPostgresPassword)
	log.Printf("Hashed password for 'postgres': %s", postgresHashedPassword)

	if !commandExists("psql") {
		log.Println("PostgreSQL is not installed. Installing...")
		installPostgresql()
	} else {
		log.Println("PostgreSQL is already installed.")
	}

	if fileExists("/etc/arch-release") {
		log.Println("Detected Arch-based system.")
		execCommand("sudo", "-u", "postgres", "initdb", "--locale", "en_US.UTF-8", "-D", "/var/lib/postgres/data")
		execCommand("sudo", "systemctl", "enable", "postgresql")
		execCommand("sudo", "systemctl", "start", "postgresql")
	} else if fileExists("/etc/debian_version") {
		log.Println("Detected Debian-based system.")
		execCommand("sudo", "service", "postgresql", "start")
	} else {
		log.Fatal("Unsupported OS. Please use Debian-based or Arch-based system.")
	}

	var pgdata string
	if fileExists("/etc/debian_version") {
		pgdata = execCommandOutput("sudo", "-u", "postgres", "psql", "-t", "-P", "format=unaligned", "-c", "SHOW data_directory;")
	} else if fileExists("/etc/arch-release") {
		pgdata = "/var/lib/postgres/data"
	} else {
		log.Fatal("Unsupported OS. Please use Debian-based or Arch-based system.")
	}
	log.Printf("PostgreSQL data directory: %s", pgdata)

	execCommand("sudo", "-u", "postgres", "psql", "-c", fmt.Sprintf("ALTER USER postgres PASSWORD '%s';", postgresPassword))
	log.Println("PostgreSQL user password updated.")

	setupSSL(pgdata)
	log.Println("SSL setup completed.")

	updatePgHbaConf(pgdata)
	log.Println("pg_hba.conf updated.")

	updatePostgresqlConf(pgdata, pgdata+"/ssl/server.crt", pgdata+"/ssl/server.key")
	log.Println("postgresql.conf updated.")

	if fileExists("/etc/debian_version") {
		execCommand("sudo", "service", "postgresql", "restart")
	} else if fileExists("/etc/arch-release") {
		execCommand("sudo", "systemctl", "restart", "postgresql")
	}
	log.Println("PostgreSQL service restarted.")

	setupDatabase(username, postgresPassword, userPassword)
	log.Println("Database setup completed.")

	entity, err := generatePGPKeys(username)
	if err != nil {
		log.Fatalf("Failed to generate PGP keys: %v", err)
	}
	log.Println("PGP keys generated.")

	publicKey, err := exportPublicKey(entity)
	if err != nil {
		log.Fatalf("Failed to export public key: %v", err)
	}
	log.Println(publicKey)

	privateKey, err := exportPrivateKey(entity)
	if err != nil {
		log.Fatalf("Failed to export private key: %v", err)
	}
	log.Println(privateKey)

	connStr := fmt.Sprintf("user=postgres password=%s dbname=text_%s sslmode=disable", postgresPassword, username)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()
	log.Println("Connected to PostgreSQL database.")

	encryptProfileTable(db, username, hashedPassword)
	log.Println("Profile table encrypted.")

	encryptMessagesTable(db, username, hashedPassword)
	log.Println("Messages table encrypted.")

	storePublicKey(db, username, publicKey, postgresHashedPassword)
	log.Println("Public key stored in database.")

	fmt.Println("Your private key (Do not lose this, you will need it for logging into your app): ")
	fmt.Printf(privateKey)

	file, err := os.Create("private_key.asc")
	if err != nil {
		log.Fatalf("Failed to create file for private key: %v", err)
	}
	defer file.Close()

	_, err = file.WriteString(privateKey)
	if err != nil {
		log.Fatalf("Failed to write private key to file: %v", err)
	}

	fmt.Println("Your private key has been saved to 'private_key.asc'. Do not lose the content of this file, you will need it for the first logging into your app.")
	log.Println("Private key saved to 'private_key.asc'.")
	fmt.Println("Your private and public key will change after your first sign in.")

	fmt.Println("Script execution completed.")
	log.Println("Script execution completed.")
}

func hashPassword(password string) string {
	hashed := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hashed[:])
}

func installPostgresql() {
	start := time.Now()
	if fileExists("/etc/debian_version") {
		log.Println("Installing PostgreSQL on Debian-based system.")
		execCommand("sudo", "apt", "update")
		execCommand("sudo", "apt", "install", "-y", "postgresql")
	} else if fileExists("/etc/arch-release") {
		log.Println("Installing PostgreSQL on Arch-based system.")
		execCommand("sudo", "pacman", "-Sy", "--noconfirm", "postgresql", "libpqxx", "postgresql-libs")
	} else {
		log.Fatal("Unsupported OS. Please use Debian-based or Arch-based system.")
	}
	log.Printf("PostgreSQL installation completed in %s", time.Since(start))
}

func setupSSL(pgdata string) {
	log.Println("Setting up SSL...")
	sslDir := pgdata + "/ssl"
	execCommand("sudo", "mkdir", "-p", sslDir)
	execCommand("sudo", "openssl", "req", "-new", "-x509", "-days", "365", "-nodes", "-out", sslDir+"/server.crt", "-keyout", sslDir+"/server.key", "-subj", "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost")
	execCommand("sudo", "chown", "postgres:postgres", sslDir+"/server.crt", sslDir+"/server.key")
	execCommand("sudo", "chmod", "600", sslDir+"/server.key")
	log.Println("SSL setup done.")
}

func updatePgHbaConf(pgdata string) {
	log.Println("Updating pg_hba.conf...")
	pgHba := pgdata + "/pg_hba.conf"
	execCommand("sudo", "cp", pgHba, pgHba+".bak")
	log.Printf("Backup of pg_hba.conf created at %s.bak", pgHba)

	pgHbaConfig := `# "local" is for Unix domain socket connections only
local   all             all                                     scram-sha-256

# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Allow connections from trusted IP range
host    all             all             192.168.1.0/24          scram-sha-256

# Reject other connections
host    all             all             0.0.0.0/0               reject
`
	writeToFile(pgHba, pgHbaConfig)
	log.Println("pg_hba.conf updated.")
}

func updatePostgresqlConf(pgdata, certFile, keyFile string) {
	log.Println("Updating postgresql.conf...")
	pgConf := pgdata + "/postgresql.conf"
	execCommand("sudo", "cp", pgConf, pgConf+".bak")
	log.Printf("Backup of postgresql.conf created at %s.bak", pgConf)

	pgConfConfig := fmt.Sprintf(`
# Connection settings
listen_addresses = 'localhost'  # change to '*' to allow remote connections
port = 5432

# SSL settings
ssl = on
ssl_cert_file = '%s'
ssl_key_file = '%s'

# Resource limits
max_connections = 99999
shared_buffers = 8GB
work_mem = 4GB

# Security and Authentication
password_encryption = scram-sha-256

# Logging settings
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%%Y-%%m-%%d_%%H%%M%%S.log'
log_statement = 'all'
log_min_duration_statement = 1000  # log queries that take longer than 1 second
`, certFile, keyFile)

	appendToFile(pgConf, pgConfConfig)
	log.Println("postgresql.conf updated.")
}

func setupDatabase(username, postgresPassword, userPassword string) {
	log.Println("Setting up database...")
	connStr := fmt.Sprintf("user=postgres password=%s dbname=postgres sslmode=disable", postgresPassword)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	_, err = db.Exec(fmt.Sprintf(`DROP DATABASE IF EXISTS text_%s;`, username))
	if err != nil {
		log.Fatalf("Failed to drop database: %v", err)
	}
	log.Printf("Dropped existing database text_%s if it existed.", username)

	_, err = db.Exec(fmt.Sprintf(`CREATE DATABASE text_%s;`, username))
	if err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}
	log.Printf("Created database text_%s.", username)

	_, err = db.Exec(fmt.Sprintf(`
		DO $$ 
		BEGIN 
			IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '%s') THEN 
				CREATE ROLE %s WITH LOGIN PASSWORD '%s'; 
			END IF; 
			IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'user') THEN 
				CREATE ROLE "user" WITH LOGIN; 
			END IF; 
		END $$;
	`, username, username, userPassword))
	if err != nil {
		log.Fatalf("Failed to create roles: %v", err)
	}
	log.Printf("Roles created for user %s.", username)
}

func generatePGPKeys(name string) (*openpgp.Entity, error) {
	log.Printf("Generating PGP keys for %s...", name)
	config := &packet.Config{
		RSABits:  2048,
		DefaultHash: crypto.SHA256,
	}
	entity, err := openpgp.NewEntity(name, "", "", config)
	if err != nil {
		return nil, err
	}
	log.Printf("PGP keys generated for %s.", name)
	return entity, nil
}

func exportPublicKey(entity *openpgp.Entity) (string, error) {
	log.Println("Exporting public key...")
	var publicKeyBuf strings.Builder
	w, err := armor.Encode(&publicKeyBuf, openpgp.PublicKeyType, nil)
	if err != nil {
		return "", err
	}

	err = entity.Serialize(w)
	if err != nil {
		return "", err
	}

	err = w.Close() 
	if err != nil {
		return "", err
	}

	log.Println("Public key exported.")
	return publicKeyBuf.String(), nil
}

func exportPrivateKey(entity *openpgp.Entity) (string, error) {
	log.Println("Exporting private key...")
	var privateKeyBuf strings.Builder
	w, err := armor.Encode(&privateKeyBuf, openpgp.PrivateKeyType, nil)
	if err != nil {
		return "", err
	}
	
	err = entity.SerializePrivate(w, nil)
	if err != nil {
		return "", err
	}

	err = w.Close()
	if err != nil {
		return "", err
	}

	log.Println("Private key exported.")
	return privateKeyBuf.String(), nil
}

func encryptProfileTable(db *sql.DB, username, hashedPassword string) {
	log.Printf("Encrypting profile table for %s...", username)
	_, err := db.Exec(fmt.Sprintf(`
		CREATE SCHEMA "%s_schema" AUTHORIZATION "%s";

		CREATE TABLE "%s_schema"."profile_table" (
			name TEXT,
			email TEXT,
			phone_number TEXT,
			avatar TEXT,
			theology TEXT,
			philosophy TEXT
		);

		INSERT INTO "%s_schema"."profile_table" (name) VALUES ('%s');

		CREATE EXTENSION pgcrypto;

		UPDATE "%s_schema"."profile_table" SET
			name = pgp_sym_encrypt(name::text, '%s'),
			email = pgp_sym_encrypt(email::text, '%s'),
			phone_number = pgp_sym_encrypt(phone_number::text, '%s'),
			avatar = pgp_sym_encrypt(avatar::text, '%s'),
			theology = pgp_sym_encrypt(theology::text, '%s'),
			philosophy = pgp_sym_encrypt(philosophy::text, '%s');

		ALTER TABLE "%s_schema".profile_table OWNER TO %s;
	`, username, username, username, username, username, username,
		hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, username, username))
	if err != nil {
		log.Fatalf("Failed to encrypt profile table: %v", err)
	}
	log.Printf("Profile table encrypted for %s.", username)
}

func encryptMessagesTable(db *sql.DB, username, hashedPassword string) {
	log.Printf("Encrypting messages table for %s...", username)
	_, err := db.Exec(fmt.Sprintf(`
		CREATE TABLE "%s_schema"."messages_table" (
			datetime_from TEXT,
			sent_by TEXT,
			send_to TEXT,
			text TEXT,
			file TEXT,
			filename TEXT
		);

		UPDATE "%s_schema"."messages_table" SET
			datetime_from = pgp_sym_encrypt(datetime_from::text, '%s'),
			sent_by = pgp_sym_encrypt(sent_by::text, '%s'),
			send_to = pgp_sym_encrypt(send_to::text, '%s'),
			text = pgp_sym_encrypt(text::text, '%s'),
			file = pgp_sym_encrypt(file::text, '%s'),
			filename = pgp_sym_encrypt(filename::text, '%s');

		ALTER TABLE "%s_schema".messages_table OWNER TO %s;
	`, username, username, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, username, username))
	if err != nil {
		log.Fatalf("Failed to encrypt messages table: %v", err)
	}
	log.Printf("Messages table encrypted for %s.", username)
}

func storePublicKey(db *sql.DB, username, publicKey, postgresHashedPassword string) {
	log.Printf("Storing public key for %s...", username)

	_, err := db.Exec(`
		CREATE SCHEMA IF NOT EXISTS postgres_schema;
		CREATE TABLE IF NOT EXISTS postgres_schema.public_keys (
			username TEXT PRIMARY KEY,
			public_key TEXT NOT NULL
		);
	`)
	if err != nil {
		log.Fatalf("Failed to set up schema or table: %v", err)
	}

	_, err = db.Exec(`
		INSERT INTO "postgres_schema"."public_keys" (username, public_key) VALUES ($1, pgp_sym_encrypt($2, $3));
	`, username, publicKey, postgresHashedPassword)
	if err != nil {
		log.Fatalf("Failed to store public key: %v", err)
	}

	log.Printf("Public key stored for %s.", username)
}

func execCommand(name string, arg ...string) {
	log.Printf("Executing command: %s %s", name, strings.Join(arg, " "))
	cmd := exec.Command("sudo", append([]string{"-S", name}, arg...)...)
	cmd.Stdin = strings.NewReader(sudoPassword + "\n")
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Failed to execute command %s: %v, output: %s", name, err, out)
	}
	log.Printf("Command executed successfully: sudo %s %s", name, strings.Join(arg, " "))
}

func execCommandOutput(name string, arg ...string) string {
	log.Printf("Executing command: %s %s", name, strings.Join(arg, " "))
	cmd := exec.Command("sudo", append([]string{"-S", name}, arg...)...)
	cmd.Stdin = strings.NewReader(sudoPassword + "\n")
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Failed to execute command %s: %v, output: %s", name, err, out)
	}
	log.Printf("Command executed successfully: sudo %s %s", name, strings.Join(arg, " "))
	return strings.TrimSpace(string(out))
}

func commandExists(cmd string) bool {
	log.Printf("Checking if command exists: %s", cmd)
	_, err := exec.LookPath(cmd)
	if err != nil {
		log.Printf("Command not found: %s", cmd)
		return false
	}
	log.Printf("Command exists: %s", cmd)
	return true
}

func fileExists(path string) bool {
	log.Printf("Checking if file exists: %s", path)
	_, err := os.Stat(path)
	if err != nil {
		log.Printf("File not found: %s", path)
		return false
	}
	log.Printf("File exists: %s", path)
	return true
}

func writeToFile(filename, content string) {
	log.Printf("Writing to file: %s", filename)
	cmd := exec.Command("sudo", "sh", "-c", fmt.Sprintf("echo \"%s\" > %s", content, filename))
	cmd.Stdin = strings.NewReader(sudoPassword + "\n")
	err := cmd.Run()
	if err != nil {
		log.Fatalf("Failed to write to file %s: %v", filename, err)
	}
	log.Printf("File written: %s", filename)
}

func appendToFile(filename, content string) {
	log.Printf("Appending to file: %s", filename)
	cmd := exec.Command("sudo", "sh", "-c", fmt.Sprintf("echo \"%s\" >> %s", content, filename))
	cmd.Stdin = strings.NewReader(sudoPassword + "\n")
	err := cmd.Run()
	if err != nil {
		log.Fatalf("Failed to append to file %s: %v", filename, err)
	}
	log.Printf("File appended: %s", filename)
}

