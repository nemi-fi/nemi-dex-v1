FROM --platform=linux/amd64 ubuntu:24.04
SHELL ["/bin/bash", "-c"]

ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=24.13.1

RUN apt update && apt install -y curl bash git tar gzip libc++-dev jq python3 build-essential

# Install nvm, node and npm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
  && . "$NVM_DIR/nvm.sh" \
  && nvm install ${NODE_VERSION} \
  && nvm use ${NODE_VERSION} \
  && nvm alias default ${NODE_VERSION}

# Add node and npm to path
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin:/root/.aztec/bin:${PATH}"

RUN npm i -g pnpm
