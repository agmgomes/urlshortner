# Url Shortner

This application allows you to shorten URLs and collect analytics data, such as number of visits, user agents and daily visits. The system uses Redis for optimized perfomance and MongoDB as the primary database for persistent storage.

## Features

### URL Shortening

- Converts long URLs into short, shareable identifiers.
- Shortend URLs can have an optional expiration date.

### Redirection

- Automatically redirects users to the original URL when accessing the short
identifier.
- Uses Redis cache to accelerate redirection.

### Analytics

- **Total Visits**: tracks the total number of visits the link was accessed.
- **Last Accessed**: Logs the date and time of the last visit.
- **User Agents**: Identifies browsers os devices used to access the URL.
- **Daily Visits**: Count visits grouped by day.

### Syncing with the Database

- Analytics are temporary stored in Redis and periodically synchronized with MongoDB for persistence.

## Technologies Used
- **Node.js** with **NestJS**: Framework for structuring the application.
- **Redis**: Cache for redirection and temporary analytics storage.
- **MongoDB**: Database for persistent storage.
- **ioredis**: Library for redis integration.
- **Mongoose**: ODM for MongoDB.

## Requirements

- **Node.js**: 18.x or higher
- **Redis** installed and running
- **MongoDB** configured and accessible
- **Docker (Optional)** for running Redis and MongoDB services

## Installation

1. Clone the repository:

```bash
git clone https://github.com/agmgomes/urlshortner.git
cd urlshortner
```

2. Install dependencies:

```bash
npm install
```

3. Configure `.env` file: Create a `.env` file in the project root and add the
environment variables:

```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. Start the application:

```bash
npm run start:dev
```

The application will be accessible locally by `http://localhost:3000`

## Endpoints

## 1. Shorten URL

`POST /shorten-url`

- **Body**:

```json
{
    #The field 'expirationTime' is in minutes and it is optional 
    "url": "https://www.github.com/",
    "expirationTime": 30 
}
```

- **Response**:

```json
{
    "url": "http://localhost:3000/{shortID}"
}
```

## 2. Redirection

`GET /{shortID}`

- Redirects to the original URL or returns an error if the identifier is invalid or expired.

## 3. Analytics

`GET /analytics/{shortID}`

- **Response**:

```json
{
    "visits": 8,
    "lastAccessed": "2024-11-28T17:14:35.233Z",
    "dailyVisits": {
        "2024-11-27": 7,
        "2024-11-28": 1
    },
    "userAgents": {
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36": 2,
        "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0": 6
  }
}
```

## Scheduled Tasks (Cron Jobs)

- **Analytics Synchronozation**:
    - Runs every minute to transfer analytics data from Redis to MongoDB.
    - Deletes Redis data after successful synchronization.

## Code Structure

### 1. Modules

- **URL Module**: Manages URL shortening and redirection.
- **Analytics Module**: Manages analytics collection and synchronization.

### 2. Interceptor

- Ensures data is stored in Redis during redirection.

# License

This project is licensed under the MIT License.
