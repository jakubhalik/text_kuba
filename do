# The app that makes the operational side of security yours only but the heavy lifting technical side only mine (you are welcome)

When you input credentials while signing and you are not trying to use a username that already exists at first public and a private gets generated only on client. 
The private key will never be known by the server, the private key will encrypt the name and the password. 
The public key will get sent to the server together with the username, encrypted username and encrypted password, the public keys will be stored in the db for authentication, only encrypted with pgp_sym via the postgres hashed credentials.
The public key will decrypt the name and password and will create a role (user) with your credentials at the db based on a template role user.
The postgres db is using scram-sha256.
Personal schema with your_name_schema will get created on the db and together with her template tables out of which only the name value will get a value.
Your decrypted name and password will combine and create a sha-256 hash with which all values of all tables will from now on be always be encrypting when inputting and decrypting when inputting.
Worry not tho, because this is only 1 of 2 factors of the encryption of all your values, all this encryption will be encrypting already encrypted values that will be encrypted on your device only with the public key so they will be always decryptable only by the private key that will only you have that will never leave your device.
You will get logged in with your new account. Login technical specification will be below when talking more deeply about login logic.
When logged in you will get a popup that if you close you can always open again through a keys button.
The popup will remind you the specifications of the key logic and how important it now is that you never loose your private key.
Because if you do loose your private key, you will never be capable to sign back into your account and it will never be recoverable. 
Now this seems horrendous, all the other apps let you forget all your passwords all the time, but you cannot forget your password and loose your private key, that is the only way you can have true security in the application you are using, this is the only way we cannot possibly have a backdoor into your account.
The view of the keys will be hidden at first, you can display it clearly by clicking a button, but do it only when your monitor/screen is not being recorded in any way.
You will also get to copy the keys without even displaying them in the page.
The private key will get saved into your strict cookies for this page, if you have allowed it for the ease of logging in in the future, but even then you absolutely should save your private key in some secure password manager, ideally in more of them over backup devices, so you can be sure of not loosing a private key.
Someone getting your private key is not such a big deal as it might seem, because with it alone one cannot really do anything to you.
You with it alone cannot do or see anything.
You have to have access to your data to decrypt the values with the private key, and you can get to those only via the authentication into the app for which u need not only the private key, but also your password.
This is a 2-factor authentication without a phone/email, security upgrade of a 2-factor auth if you will.
But even tho one cannot do anything with your private key alone, if you suspect that someone knows it you should as fast as possible, just to be safe, sign in and generate new keys, there will be a button for this that will also on your device decrypt all your data with your private key will generate the new keys, will encrypt them with the new public key, will burn the old private key from your cookies (if u have it there), will throw the new one there (if u let it there), will send a message to the server to burn the old public key and all values encrypted with it and will replace them with the newly encrypted values on your device with the new public key that will also be saved in the db encrypted in the same way as it was before.

When you login in the default mode the process of logging in will continue only if a private key is in your cookies, if you have selected the no-cookies mode, you will have to input the private key, into the input on the page with the credentials for it to on your device only encrypt the name and password so it can be sent on to the server where it will be decrypted with the public key that is saved under your name. If either there is not even a public key with the name you are trying to login with or a sign in in the postgres pool cannot happen with the decrypted credentials decrypted via the public key you will get a wrong credentials error.

During sign up and login you will get a loading bar in the place of the error message so you know your new request was sent.
