FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal

RUN go build -o /pet-slay-api ./cmd/server

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /pet-slay-api /usr/local/bin/pet-slay-api

EXPOSE 8080

CMD ["pet-slay-api"]
