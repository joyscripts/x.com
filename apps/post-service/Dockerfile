FROM node:24-alpine

WORKDIR /workspace

COPY package.json yarn.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN yarn install --frozen-lockfile

WORKDIR /workspace/apps/post-service

EXPOSE 4004

CMD ["yarn", "dev"]
