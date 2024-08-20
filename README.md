# End to End PGP Encrypted Messaging App

## The app that makes the operational side of security yours only but the heavy lifting technical side only mine

### Version 0.1.2 - Pre-Alpha

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
The private key will get saved into your strict cookies for this page, but you absolutely should save your private key in some secure password manager, ideally in more of them over backup devices, so you can be sure of not loosing a private key.
Someone getting your private key is not such a big deal as it might seem, because with it alone one cannot really do anything to you.
You with it alone cannot do or see anything.
You have to have access to your data to decrypt the values with the private key, and you can get to those only via the authentication into the app for which u need not only the private key, but also your password.
This is a 2-factor authentication without a phone/email, security upgrade of a 2-factor auth if you will.
But even tho one cannot do anything with your private key alone, if you suspect that someone knows it you should as fast as possible, just to be safe, sign in and generate new keys, there will be a button for this that will also on your device decrypt all your data with your private key will generate the new keys, will encrypt them with the new public key, will burn the old private key from your cookies (if u have it there), will throw the new one there, will send a message to the server to burn the old public key and all values encrypted with it and will replace them with the newly encrypted values on your device with the new public key that will also be saved in the db encrypted in the same way as it was before.
Now the only data decryptable by the server will be the from whom are which encrypted messages sent to whom: That is required for the server to be capable of sending the messages from one user to the other, but worry not, you already have the full anonymity of what are you sending to anyone and you can have the anonymity of to whom you are sending the encrypted messages/files/filenames by just choosing an alias nickname instead of any name which actually describes your real identity in any way.
The communication part: Each time you will message anyone the message will be first signed by your private key and then encrypted by the public key of the person you are sending the message to so only his private key that only he has can decrypt the message you sent him and so when he was capable of decrypting it through having his private key he can also verify that the message was really from you through the public one of yours that he as your friend automatically has.
When you login in the default mode the process of logging in will continue only if a private key is in your cookies for it to on your device only encrypt the name and password so it can be sent on to the server where it will be decrypted with the public key that is saved under your name so it can there log you into your account on the postgres database through a pool, so you can have access to your personal schema on the database. If either there is not even a public key with the name you are trying to login with or a sign in in the postgres pool cannot happen with the decrypted credentials decrypted via the public key you will get a wrong credentials error.
From here down it's just messy "docs" of what was done so far in my process, it works well for me to remember what I worked on, and maybe can be good for devs to kinda get into the "so what was implemented here so far so I can understand this repo for my use/contribution" mode

The public keys will be in a postgres_schema

During sign up and login you will get a loading bar in the place of the error message so you know your new request was sent and when signed in while decrypting messages and all around your data with your key/keys loading bar

The login is so if the username === owner and there is not an owner_initial_sign_in_happened enum in postgres_schema, so the client side generating of public and a private key as it happens in the sign up happens in this case also in the login with them also getting set in the strict cookies and with the public one replacing whatever is under that name in the postgres schema public keys now

When the last message in the chat sidebar is too long, for example longer than 10 chars, do not show the entirety of it but just the first 10 for example and then ...

When opening the private key popup make the textarea selected by the user

When login and password already inputted make setting the private key to cookies relog with that private key and the credentials

fix: 
 ⨯ unhandledRejection: error: relation "postgres_schema.messages_table" does not exist
    at /home/x/d/g/gh/text_kuba/node_modules/pg/lib/client.js:526:17
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async $$ACTION_1 (webpack-internal:///(rsc)/./app/page.tsx:194:31) {
  length: 130,
  severity: 'ERROR',
  code: '42P01',
  detail: undefined,
  hint: undefined,
  position: '391',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_relation.c',
  line: '1428',
  routine: 'parserOpenTable'
}


and:
Error in decryptWithPublicKey: Error: Could not find signing key with key ID 7fb0857d3926ef71
    at eval (webpack-internal:///(rsc)/./node_modules/openpgp/dist/node/openpgp.min.mjs:62:356378)
    at eval (webpack-internal:///(rsc)/./node_modules/openpgp/dist/node/openpgp.min.mjs:62:356846)
    at eval (webpack-internal:///(rsc)/./node_modules/openpgp/dist/node/openpgp.min.mjs:62:356994)
    at _u.map (<anonymous>)
    at Th (webpack-internal:///(rsc)/./node_modules/openpgp/dist/node/openpgp.min.mjs:62:356113)
    at Ih.verify (webpack-internal:///(rsc)/./node_modules/openpgp/dist/node/openpgp.min.mjs:62:354892)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Module.Yh (webpack-internal:///(rsc)/./node_modules/openpgp/dist/node/openpgp.min.mjs:62:369629)
    at async decryptWithPublicKey (webpack-internal:///(rsc)/./actions/decryptWithPublicKey.ts:25:36)
    at async $$ACTION_2 (webpack-internal:///(rsc)/./app/page.tsx:361:31)
    at async /home/x/d/g/gh/text_kuba/node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js:39:406
    at async t2 (/home/x/d/g/gh/text_kuba/node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js:38:6412)
    at async rS (/home/x/d/g/gh/text_kuba/node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js:41:1369)
    at async doRender (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:1376:30)
    at async cacheEntry.responseCache.get.routeKind (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:1537:28)
    at async DevServer.renderToResponseWithComponentsImpl (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:1445:28)
    at async DevServer.renderPageComponent (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:1842:24)
    at async DevServer.renderToResponseImpl (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:1880:32)
    at async DevServer.pipeImpl (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:893:25)
    at async NextNodeServer.handleCatchallRenderRequest (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/next-server.js:269:17)
    at async DevServer.handleRequestImpl (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/base-server.js:789:17)
    at async /home/x/d/g/gh/text_kuba/node_modules/next/dist/server/dev/next-dev-server.js:331:20
    at async Span.traceAsyncFn (/home/x/d/g/gh/text_kuba/node_modules/next/dist/trace/trace.js:151:20)
    at async DevServer.handleRequest (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/dev/next-dev-server.js:328:24)
    at async invokeRender (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/lib/router-server.js:174:21)
    at async handleRequest (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/lib/router-server.js:353:24)
    at async requestHandlerImpl (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/lib/router-server.js:377:13)
    at async Server.requestListener (/home/x/d/g/gh/text_kuba/node_modules/next/dist/server/lib/start-server.js:140:13)
 ⨯ node_modules/openpgp/dist/node/openpgp.min.mjs (2:356117) @ eval
 ⨯ Error: Could not find signing key with key ID 7fb0857d3926ef71
    at _u.map (<anonymous>)
    at async decryptWithPublicKey (./actions/decryptWithPublicKey.ts:25:36)
    at async $$ACTION_2 (./app/page.tsx:361:31)

fix the mistake that makes it impossible now for more than one person to be logged in at once lol, it is in the Home function , loggedIn server side handling without implementation for handling infinite users, rookie mistake
the session variables are fine, but the mutable ones cannot be only in the Home function , it is how my whole logging in works, those mutable variables that are global across the entire file must stay that way , but what I need u to change is for it to not be loggedIn but loggedInUsers so each time a new user logs in he is added to the loggedInUsers server cached array, I want you to cache these values in loggedInUsers for 24 hours so u then in the xml returning part do not do loggedIn && but loggedIn[decryptedUsername] &&

fix of the crashing when someone signs up when other are logged in

text transfer via sign with my private key and encryption with the public key of recipient and inverse decryption
    this will need the messenger component to send the public keys of users the user can chat with to the chat component and for the chat component to be doing for all messages/files/filenames/dates not just the encryptions it does for its own storage, but to also besides that encrypt it the way mentioned above with that being sent back to the messenger component with there being those arguments used in the saving in postgres_schema instead of the same way as is the other stored there
    asking for the public keys in a separate query from the one for the users, so u can also select the owner one all normally and then in a later condition send all the public keys but the owner one to the chat component only if the username === `${owner}` and to otherwise send only the owner public key

hover on bg in the sidebar (I get that when it is in phone mode it is not exactly a sidebar), probly like blue, when it is the li of the selectedUser , and fixing the light theme for MessageInput

pseudorandom profile pics for fun now before profiles

websockets encryption and decryption the same way as above with the keys

encrypting and decrypting dates too

sorting by ascending dates on the client

fix viewing pictures
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

#### The main components of the application are right now in the app and components directories and the setup_db.go for the setup of the database logic and 2 main user roles

## READ THE GO/BASH/PYTHON SCRIPTS BEFORE RUNNING THEM! - U don't want to delete your things on an accident.

### For running the application (In only dev mode so far)

```bash
# The script below right now supports only Arch Linux or Debian Linux
# Or run things for your postgres db based on what is inside manually
go build setup_db.go
mv setup_db setup_db_bin
./setup_db_bin
# or if you want your binary to be really small:
tinygo build -o setup_db_bin setup_db.go
strip -s setup_db_bin
./setup_db_bin
# or if u do not care about compiling:
go run setup_db.go

bun wsServer.js

bun run dev
```

### Debugging "docs"
```bash
# This will not be that glamorous,
# Just either drop the tables, enums, roles manually or just kill and rerun the setup db:
go build kill_postgres.go
mv kill_postgres kill_postgres_bin
strip -s kill_postgres_bin
./kill_postgres_bin
go build setup_db.go
mv setup_db setup_db_bin
strip -s setup_db_bin
# If u tried to get back to some way of app being for debugging by raw sqling and now u don't know why something does not work normally anymore, just run the go scripts mate
./setup_db_bin
Delete the session cookies if u have them in your browser
```

# This project is NOT fininshed yet, it is still a work in progress - Pre-Alpha

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

