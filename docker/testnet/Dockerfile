FROM christroutner/ct-base-ubuntu
MAINTAINER Chris Troutner <chris.troutner@gmail.com>

RUN apt-get update -y

#Set the working directory to be the home directory
WORKDIR /home/safeuser

# Switch to user account.
USER safeuser
# Prep 'sudo' commands.
#RUN echo 'abcd8765' | sudo -S pwd

# Clone the repository
WORKDIR /home/safeuser
RUN git clone https://github.com/Permissionless-Software-Foundation/bch-api
WORKDIR /home/safeuser/bch-api
RUN git checkout free
RUN npm install

# Generate documentation
RUN npm run docs

EXPOSE 3000

COPY start-local-testnet.sh start-local-testnet.sh
CMD ["./start-local-testnet.sh"]
