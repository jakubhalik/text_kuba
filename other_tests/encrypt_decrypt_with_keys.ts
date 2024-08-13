import * as openpgp from 'openpgp';

const publicKeyArmored = 
`-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZrsGWRYJKwYBBAHaRw8BAQdAuX4H/gVkXgVv9a+uJNphgC6iiFF19WIk
/x6vvFmVYyTNBmVsaXNrYcKMBBAWCgA+BYJmuwZZBAsJBwgJkDUuzGMR3XWr
AxUICgQWAAIBAhkBApsDAh4BFiEErAsmLGpwvgdSlKYmNS7MYxHddasAAJ8d
AP4n0cvQuz3Sz4XUwync8Xte3JpwJfOLozadv+Ga5bvqTwEApEJLW+4y3GoR
IZ2cxdzRpgWXwFuhQB+CEsIlBHZAvwvOOARmuwZZEgorBgEEAZdVAQUBAQdA
/xuK7qx5OeMXTYEaRfc4Hn2HmumjYRPKT6LqhuhLhUwDAQgHwngEGBYKACoF
gma7BlkJkDUuzGMR3XWrApsMFiEErAsmLGpwvgdSlKYmNS7MYxHddasAAM+H
AQCaKkbqmWZPDq+dB2qzF3h5n//wFSJO95+J1avGrKHCRgEAtAoHbzarsY+I
3I9Ax5v+l8PfURTaL9o0x7lt27p7fwU=
=mlFb
-----END PGP PUBLIC KEY BLOCK-----`;

const privateKeyArmored = 
`-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEZrsF8RYJKwYBBAHaRw8BAQdA3TsYwJLraU0BIXGPqq5X2hoChegGkdeY
vEsRJTFgZgMAAQDskq5MyqyYGAAKDqnADmhYpeJkiDk7dSUjR1NEQ6ftGQ1g
zQRrdWJhwowEEBYKAD4Fgma7BfEECwkHCAmQRh4uTa4jIAYDFQgKBBYAAgEC
GQECmwMCHgEWIQSmmUuRhDa2QFaSBcRGHi5NriMgBgAAlEYBAIqCXFmuqsAH
JBAYjBCcpnAww5K/GeS3j55PIq3QsaqIAP9M7a8pqeTaGxdUooN70BDy4Ok9
o/DKWUdSWvndu7ssD8ddBGa7BfESCisGAQQBl1UBBQEBB0CSPOaPp8yUzYUE
vSIcUNf0O4dQANezRKn/3MTPK01NQwMBCAcAAP9eyEZN5UqWnpRe3eioThoT
nSKmZOdtUG3tpvHHcGfjuBKMwngEGBYKACoFgma7BfEJkEYeLk2uIyAGApsM
FiEEpplLkYQ2tkBWkgXERh4uTa4jIAYAABgtAQDSUWciiTLoM2dBCUR/GE8S
RiraYHMOPBrmZ3mGxz0SLQEAgCYCxspmZ0ZKxcicm6PEhTZP/kNqxHbMBPF9
z1NwIgA=
=QnJ0
-----END PGP PRIVATE KEY BLOCK-----`;

async function testEncryptionDecryption() {
  try {
    const message = 'Hello, this is a test message!';

    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: await openpgp.readKey({ armoredKey: publicKeyArmored }),
    });

    console.log('Encrypted Message:', encrypted);

    const privateKey = await openpgp.readPrivateKey({
      armoredKey: privateKeyArmored,
    });
    console.log('private key: ', privateKey);

    const decrypted = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: encrypted }),
      decryptionKeys: privateKey,
    });

    console.log('Decrypted Message:', decrypted.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEncryptionDecryption();
