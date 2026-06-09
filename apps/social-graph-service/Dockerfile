FROM node:24-alpine

WORKDIR /workspace

COPY package.json yarn.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN yarn install --frozen-lockfile

WORKDIR /workspace/apps/social-graph-service

EXPOSE 4003

CMD ["yarn", "dev"]
