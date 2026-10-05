# API Contract — BM Knowledge Assistant Gateway

Audience: a frontend coding agent. Implement the chat client against this document only.

The browser calls this API Gateway for chat. Send the Core (WEB Core) access token. The gateway validates that token with Core, checks menu permission, then calls the AI Orchestrator.

Login is the exception: the frontend calls Core directly (`POST /auth/login`). It does not call Core profile, Core menu permissions, or the AI Orchestrator.

Behavior source: controllers, DTOs, and mappers in `apps/api-gateway`. Interactive docs, when enabled: `GET /api/docs`.

| | |
|---|---|
| Base path | `/api/v1` |
| Local default | `http://localhost:3000/api/v1` |
| Body format | `application/json` |
| Field names | `snake_case` |
| Auth | `Authorization: Bearer <core_access_token>` |

Only `/api/v1` is mounted. The Swagger server entry `/api/v2` has no routes.

---

## 1. Request rules

| Header | Required | Value |
|---|---|---|
| `Authorization` | Yes, every gateway route below | `Bearer <token>`. The scheme is the exact string `Bearer`, then one space, then the token. Omit this header on Core login. |
| `Content-Type` | Yes on `POST` | `application/json` |
| `Accept` | No | Success bodies are JSON, except delete (`204`, empty body). |

Rules for every request:

1. Omit `user` from query and body. The gateway sets it from the Core profile `userId`. A request that includes `user` returns `400` (unknown property).
2. An empty string on an optional field is treated as omitted.
3. Unknown JSON properties are rejected with `400` (`whitelist` + `forbidNonWhitelisted`).
4. Gateway routes have no login. Obtain `access_token` from Core login (section 5.0), then send it on gateway routes.

---

## 2. Authorization

Every gateway route in this document requires Core menu `chat` and permission `show-list-data`. Core login does not.

| Condition | HTTP |
|---|---|
| `Authorization` missing or token empty | `401` |
| Core rejects the token | `401` |
| Core profile has no `userId` | `401` |
| User lacks `chat` / `show-list-data` | `403` |

---

## 3. Error envelope

Gateway-generated errors use the NestJS envelope:

```json
{
  "statusCode": 400,
  "message": "string, or string[] when validation fails",
  "error": "Bad Request"
}
```

On `400`, `message` is a string array: one sentence per failed rule.

| HTTP | `error` | When | `message` |
|---|---|---|---|
| `400` | `Bad Request` | Body or query fails validation, or the payload contains an unknown field | validator string array |
| `401` | `Unauthorized` | Missing token, Core rejected the token, or `userId` is missing | `Missing bearer token` / `Core rejected the bearer token` / `Core profile is missing userId` |
| `403` | `Forbidden` | Menu permission missing | `Missing permission "show-list-data" for menu "chat"` |
| `502` | `Bad Gateway` | Orchestrator rejected the server API key, or the orchestrator payload failed gateway mapping | see fixed messages below |
| `503` | `Service Unavailable` | Core or the orchestrator is unreachable (timeout or network) | `Core service is unavailable` / `AI Orchestrator is unavailable` |

Fixed `502` `message` values:

| `message` |
|---|
| `AI Orchestrator rejected the API key` |
| `AI Orchestrator returned an invalid conversation list` |
| `AI Orchestrator returned an invalid conversation` |
| `AI Orchestrator returned an invalid conversation history` |
| `AI Orchestrator returned an invalid message` |
| `AI Orchestrator returned an invalid chat message` |
| `AI Orchestrator returned invalid suggested questions` |
| `Core profile response is missing user data` |

If Core returns a status other than `401` while loading the profile, the gateway forwards that Core HTTP status with `message` `Core profile request failed`.

Any other orchestrator status (for example `404`) is forwarded as-is, including the raw orchestrator body. That body is not wrapped in the envelope above. Orchestrator `401` and `403` are not forwarded; both become `502` with `AI Orchestrator rejected the API key`.

Validation `400` example:

```json
{
  "statusCode": 400,
  "message": [
    "query should not be empty",
    "query must be shorter than or equal to 10000 characters"
  ],
  "error": "Bad Request"
}
```

Handle `401` by refreshing or replacing the Core access token. Handle `403` as a missing chat permission. A `502` with `AI Orchestrator rejected the API key` is a server configuration failure, not a user-token failure.

---

## 4. Shared types

### Timestamp

`created_at` and `updated_at` are `number | null`. The gateway forwards the orchestrator number unchanged. This contract does not define the epoch unit.

### Cursor page

List responses are cursor pages, not page numbers:

| Field | Type | Meaning |
|---|---|---|
| `data` | array | Items in this page |
| `has_more` | boolean | `true` when another page exists |
| `limit` | number | Page size chosen by the orchestrator |

Query `limit` is an integer from `1` to `100`. When omitted, the gateway does not send a default; the orchestrator chooses the page size.

### Passthrough values

`inputs` and `metadata` are JSON objects. `message_files` and `retriever_resources` are arrays. The gateway does not define the shape of their elements. Read them as `Record<string, unknown>` and `unknown[]`.

`status`, `event`, and `mode` are unconstrained strings (or null where noted). Sample strings in the examples are illustrative.

---

## 5. Endpoints

### 5.0 Login — call Core directly

`POST {CORE_BASE_URL}/auth/login`

This route is on Core, not on the gateway. Do not call `POST /api/v1/auth/login`.

The access token must be issued by the same Core base the gateway uses (`CORE_BASE_URL`). A token from a different host fails later gateway calls with `401` and `message` `Core rejected the bearer token`.

`CORE_BASE_URL` comes from `.env`. Do not hardcode the host in this repo.

No `Authorization` header. `Content-Type: application/json`.

**Body** — the three fields `CoreClient.login()` sends to Core:

| Name | Required | Type | Rules |
|---|---|---|---|
| `email` | Yes | string | Email address. |
| `password` | Yes | string | Non-empty. The unused gateway `LoginDto` caps this at 128 characters. Core's own max length is not defined in this repo. |
| `app_code` | Yes | string | Value of `CORE_APP_CODE` from `.env`. The gateway would have injected it; a direct call must send it. |

```json
{
  "email": "user@example.com",
  "password": "secret",
  "app_code": "<CORE_APP_CODE>"
}
```

**Success** — read `access_token` from the top level. That string is the bearer token for every gateway route in this document. The gateway login mapper (`LoginMapper`) expects this field and rejects a body that omits it.

`core-login.interface.ts` marks the rest of the body as assumed until a live Core payload is confirmed. Fields this repo reads when present:

| Field | Type | Use |
|---|---|---|
| `access_token` | string | Required. Store it. Send as `Authorization: Bearer <access_token>` to the gateway. |
| `user.user_id` | string | Optional in the assumed shape. |
| `user.email` | string | Optional in the assumed shape. |
| `user.employee` | unknown | Optional. Shape is not defined on the login type. |
| `user.auth_user_applications[].applications.application_code` | string | Optional. |
| `user.auth_user_roles[].auth_roles.role_name` | string | Optional. |

```json
{
  "access_token": "<core_access_token>",
  "user": {
    "user_id": "user-id",
    "email": "user@example.com"
  }
}
```

The sample above shows only the fields the client must rely on. Core may return additional properties. Do not expect the gateway's camelCase `accessToken` wrapper; that mapping runs only on the inactive gateway login route.

**Failure** — Core's HTTP status and Core's body, unchanged. This repo does not define that error JSON. `CoreClient` forwards Core's status (invalid credentials stay whatever status Core returned, often a `401`). A network failure is not a Core body. The Nest envelope in section 3 applies only to gateway routes.

After a successful login, call the gateway with that token. Do not send `email` or `password` to the gateway.

---

### 5.1 List conversations

`GET /api/v1/conversations`

Returns the signed-in user's conversations.

**Query**

| Name | Required | Type | Rules |
|---|---|---|---|
| `last_id` | No | string | Id of the last item in the current page (`data[data.length - 1].id`). Omit on the first page. |
| `limit` | No | integer | `1`–`100` |
| `sort_by` | No | enum | `-updated_at`, `-created_at`, `created_at`, `updated_at`. A leading `-` means descending. Use `-updated_at` for a recent-first sidebar. |

**200**

```json
{
  "data": [
    {
      "id": "202e779a-a8d2-4800-b05c-521cb94f916c",
      "name": "SEPINOV EMT 10",
      "status": "normal",
      "inputs": {},
      "introduction": null,
      "created_at": 1710000000,
      "updated_at": 1710003600
    }
  ],
  "has_more": false,
  "limit": 20
}
```

| Field | Type | Use |
|---|---|---|
| `data[].id` | string | Conversation id. Send as `conversation_id` on history and on the next chat message. Also the path id for rename and delete. |
| `data[].name` | string | Title to display. |
| `data[].status` | string | Orchestrator status string. Not an enum on the gateway. |
| `data[].inputs` | object | `{}` when the orchestrator did not send an object. |
| `data[].introduction` | string \| null | |
| `data[].created_at` | number \| null | |
| `data[].updated_at` | number \| null | |

Next page: repeat the same query with `last_id` set to the last item `id` while `has_more` is `true`.

---

### 5.2 Conversation message history

`GET /api/v1/conversations-history`

**Query**

| Name | Required | Type | Rules |
|---|---|---|---|
| `conversation_id` | Yes | string | Id from the conversation list or from the send-message response. |
| `first_id` | No | string | Id of the first item in the current page (`data[0].id`), used to load older messages. Omit on the first page. |
| `limit` | No | integer | `1`–`100` |

**200**

```json
{
  "data": [
    {
      "id": "6bdac479-0884-4baf-990f-319b2a629417",
      "conversation_id": "202e779a-a8d2-4800-b05c-521cb94f916c",
      "query": "is SEPINOV EMT 10 classified as a hazardous chemical?",
      "answer": "Yes. Treat it according to the SDS.",
      "status": null,
      "inputs": {},
      "error": null,
      "parent_message_id": null,
      "created_at": 1710003600,
      "message_files": [],
      "retriever_resources": []
    }
  ],
  "has_more": false,
  "limit": 20
}
```

| Field | Type | Use |
|---|---|---|
| `data[].id` | string | Message id. Use for suggested questions and as `first_id`. |
| `data[].conversation_id` | string | |
| `data[].query` | string | User message text. |
| `data[].answer` | string | Assistant reply text. |
| `data[].status` | string \| null | |
| `data[].inputs` | object | |
| `data[].error` | string \| null | Present when the orchestrator stored an error on that message. |
| `data[].parent_message_id` | string \| null | |
| `data[].created_at` | number \| null | |
| `data[].message_files` | unknown[] | Attachments. Element shape is not defined by the gateway. |
| `data[].retriever_resources` | unknown[] | Knowledge sources. Element shape is not defined by the gateway. |

---

### 5.3 Send a chat message

`POST /api/v1/chat-messages`

Blocking mode: the HTTP response arrives after the answer is complete. Wait at least **60 seconds**. The gateway does not retry this call. A timeout returns `503` with `AI Orchestrator is unavailable`. The client must not auto-retry: a retry can duplicate the user message.

**Body**

| Name | Required | Type | Rules |
|---|---|---|---|
| `query` | Yes | string | Non-empty. Max length 10000. |
| `inputs` | No | object | Gateway default when omitted: `{}`. An array is invalid. |
| `conversation_id` | No | string | Omit, or send an empty string, to start a new conversation. Send an existing id to continue that thread. |
| `response_mode` | No | `"blocking"` | The only accepted value is `blocking`. When omitted, the gateway sends `blocking`. Any other value returns `400`. |

New conversation:

```json
{
  "query": "is SEPINOV EMT 10 classified as a hazardous chemical?"
}
```

Continue a thread:

```json
{
  "query": "What PPE is required?",
  "conversation_id": "202e779a-a8d2-4800-b05c-521cb94f916c",
  "inputs": {}
}
```

**200**

```json
{
  "event": null,
  "task_id": null,
  "id": "6bdac479-0884-4baf-990f-319b2a629417",
  "message_id": "6bdac479-0884-4baf-990f-319b2a629417",
  "conversation_id": "202e779a-a8d2-4800-b05c-521cb94f916c",
  "mode": null,
  "answer": "Yes. Treat it according to the SDS.",
  "metadata": null,
  "created_at": 1710003600
}
```

`event`, `task_id`, and `mode` in this example are `null`. The orchestrator may return strings instead. Treat them as `string | null`.

| Field | Type | Use |
|---|---|---|
| `answer` | string | Assistant reply. Always present. |
| `conversation_id` | string | Persist it. Send it on the next message in the same thread. |
| `message_id` | string \| null | Preferred id for suggested questions. |
| `id` | string \| null | Fallback message id when `message_id` is null. Prefer `message_id`. |
| `event` | string \| null | |
| `task_id` | string \| null | |
| `mode` | string \| null | |
| `metadata` | object \| null | Passthrough object. |
| `created_at` | number \| null | |

Streaming is not available on this route.

---

### 5.4 Suggested questions

`GET /api/v1/chat-messages/{message_id}/suggested`

`message_id` comes from the send-message response: use `message_id`, or `id` when `message_id` is null.

**200**

```json
{
  "result": "success",
  "data": [
    "What is the SDS classification?",
    "Is it flammable?"
  ]
}
```

| Field | Type | Use |
|---|---|---|
| `result` | string | Orchestrator result string. Sample value `success` is illustrative. |
| `data` | string[] | Suggestion labels. Send a chosen string as the next `query` on the same `conversation_id`. |

---

### 5.5 Rename a conversation

`POST /api/v1/conversations/{conversation_id}/name`

**Body**

| Name | Required | Type | Rules |
|---|---|---|---|
| `name` | Yes, unless `auto_generate` is `true` | string | Non-empty. Max length 255. |
| `auto_generate` | No | boolean | JSON boolean. `true` asks the orchestrator to generate the title; `name` may be omitted. |

Manual title:

```json
{ "name": "SEPINOV EMT 10" }
```

Generated title:

```json
{ "auto_generate": true }
```

**200** — one conversation object, the same shape as `data[]` in list conversations. It is not wrapped in `{ data, has_more, limit }`.

---

### 5.6 Delete a conversation

`DELETE /api/v1/conversations/{conversation_id}`

No body.

**204** — empty body.

The gateway does not retry delete. A `503` after a timeout does not prove the conversation still exists.

---

## 6. Client flow

1. `POST {CORE_BASE_URL}/auth/login` with `email`, `password`, and `app_code` set to `CORE_APP_CODE`. Store `access_token`.
2. `GET /api/v1/conversations` for the sidebar, with `Authorization: Bearer <access_token>`. While `has_more` is `true`, request the next page with `last_id` set to the last item `id`.
3. `GET /api/v1/conversations-history?conversation_id=` when a thread opens.
4. `POST /api/v1/chat-messages`. New thread: omit `conversation_id`. Existing thread: send the stored `conversation_id`.
5. Render `answer`. Persist `conversation_id` from the response.
6. `GET /api/v1/chat-messages/{message_id}/suggested` for suggestion chips. A chip sends that string as `query` with the same `conversation_id`.
7. `POST /api/v1/conversations/{conversation_id}/name` to rename. `DELETE /api/v1/conversations/{conversation_id}` to delete; on `204`, remove the item from the sidebar.

Client timeout for send-message: greater than 60 seconds. List, history, suggested questions, and rename: the gateway retries network failures up to 3 times, 5 seconds each.

---

## 7. Not part of this contract

These gateway routes are not active. Do not call them:

- `POST /api/v1/auth/login` (handler exists in source and is commented out). Login is `POST {CORE_BASE_URL}/auth/login` in section 5.0.
- `/api/v1/activities` (module is not registered)

Swagger: `http://localhost:3000/api/docs` when `NODE_ENV` is not `production`, or when `SWAGGER_ENABLED=true`. In Swagger Authorize, paste the token without the `Bearer ` prefix.

This gateway does not call `enableCors()` during bootstrap. A browser call from another origin needs a same-origin proxy or a separate CORS configuration.
