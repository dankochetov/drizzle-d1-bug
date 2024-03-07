# Drizzle D1 Bug

## Reproduction

- Install dependencies with `npm install`
- Run `node index.js` and observe the output

There seems to be an off by one error somewhere.

## Expected output

```json
{
  "user": {
    "id": "user-id-1",
    "name": "Alice"
  },
  "session": {
    "id": "session-id-1",
    "userId": "user-id-1",
    "expiresAt": 123456
  }
}
```

## Actual output

```json
{
  "user": {
    "id": "session-id-1",
    "name": "Alice"
  },
  "session": {
    "id": "user-id-1",
    "userId": 123456
  }
}
```

`session.expiresAt` _is_ set but it's `undefined` (which gets stripped by `JSON.stringify`).
