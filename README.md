# Encrypted Chat App

This chat app uses end-to-end-encryption with RSA-OAEP.
The encryption is done on the client using the Web Crypto API

## Screenshots

![Login page](screenshots/login.png)

![User profile](screenshots/user-profile.png)

![User search](screenshots/user-search.png)

![Chat with messages](screenshots/chat-with-messages.png)

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# yarn
yarn install

# bun
bun install
```

### Database Setup

```bash
# npm
npm run dbinit
npm run dbgenerate

# yarn
yarn dbinit
yarn dbgenerate

# bun
bun dbinit
bun dbgenerate
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# yarn
yarn dev

# bun
bun dev
```

### Production

Build the application for production:

```bash
# npm
npm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# yarn
yarn preview

# bun
bun preview
```

Serve the production build using PM2:

```bash
# npm
npm run start

# yarn
yarn start

# bun
bun start
```
