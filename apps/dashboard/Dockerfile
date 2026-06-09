FROM node:24-alpine

WORKDIR /workspace

COPY package.json yarn.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN yarn install --frozen-lockfile

WORKDIR /workspace/apps/dashboard

EXPOSE 5173

CMD ["yarn", "dev", "--host", "0.0.0.0"]
