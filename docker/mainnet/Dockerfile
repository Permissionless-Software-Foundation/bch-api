FROM ubuntu:20.04
MAINTAINER Chris Troutner <chris.troutner@gmail.com>

#Update the OS and install any OS packages needed.
RUN apt-get update
RUN apt-get install -y sudo git curl nano gnupg wget

#Install Node and NPM
RUN curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs build-essential

#Create the user 'safeuser' and add them to the sudo group.
RUN useradd -ms /bin/bash safeuser
RUN adduser safeuser sudo

#Set password to 'abcd8765' change value below if you want a different password
RUN echo safeuser:abcd8765 | chpasswd

#Set the working directory to be the users home directory
WORKDIR /home/safeuser

#Setup NPM for non-root global install (like on a mac)
RUN mkdir /home/safeuser/.npm-global
RUN chown -R safeuser .npm-global
RUN echo "export PATH=~/.npm-global/bin:$PATH" >> /home/safeuser/.profile
RUN runuser -l safeuser -c "npm config set prefix '~/.npm-global'"

# Update to the latest version of npm.
# Working with npm@7.21.1
RUN npm install -g npm

#FROM christroutner/ct-base-ubuntu
#MAINTAINER Chris Troutner <chris.troutner@gmail.com>

#RUN apt-get update -y

#Set the working directory to be the home directory
#WORKDIR /home/safeuser

# Switch to user account.
USER safeuser
# Prep 'sudo' commands.
#RUN echo 'abcd8765' | sudo -S pwd

# Clone the repository
WORKDIR /home/safeuser
RUN git clone https://github.com/Permissionless-Software-Foundation/bch-api
WORKDIR /home/safeuser/bch-api
RUN git checkout ct-unstable
RUN npm install --silent

# Generate documentation
RUN npm run docs

EXPOSE 3000

COPY start-local-mainnet.sh start-local-mainnet.sh
CMD ["./start-local-mainnet.sh"]
