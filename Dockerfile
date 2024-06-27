FROM oven/bun:latest
RUN apt-get update 
RUN apt-get install -y ca-certificates curl gnupg
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update 
RUN apt-get install nodejs -y
WORKDIR /opt/mpg
COPY ./tsconfig.json /opt/mpg/tsconfig.json
COPY ./package.json /opt/mpg/package.json
COPY ./prisma /opt/mpg/prisma
ENV NODE_ENV=production
RUN bun install
RUN bun generate
COPY ./src /opt/mpg/src



