package main

import (
	"bytes"
	"fmt"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
)

func main() {
	// entity, err := openpgp.NewEntity("Your Name", "Description", "your.email@example.com", nil)
	entity, err := openpgp.NewEntity("", "", "", nil)
	if err != nil {
		fmt.Println("Error creating entity:", err)
		return
	}

	var privateKeyBuf bytes.Buffer
	privateKeyWriter, err := armor.Encode(&privateKeyBuf, openpgp.PrivateKeyType, nil)
	if err != nil {
		fmt.Println("Error encoding private key:", err)
		return
	}
	err = entity.SerializePrivate(privateKeyWriter, nil)
	if err != nil {
		fmt.Println("Error serializing private key:", err)
		return
	}
	privateKeyWriter.Close()

	var publicKeyBuf bytes.Buffer
	publicKeyWriter, err := armor.Encode(&publicKeyBuf, openpgp.PublicKeyType, nil)
	if err != nil {
		fmt.Println("Error encoding public key:", err)
		return
	}
	err = entity.Serialize(publicKeyWriter)
	if err != nil {
		fmt.Println("Error serializing public key:", err)
		return
	}
	publicKeyWriter.Close()

	fmt.Println("Private Key:")
	fmt.Println(privateKeyBuf.String())

	fmt.Println("Public Key:")
	fmt.Println(publicKeyBuf.String())
}

