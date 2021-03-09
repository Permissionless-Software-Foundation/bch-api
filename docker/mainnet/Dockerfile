FROM christroutner/ct-base-ubuntu
MAINTAINER Chris Troutner <chris.troutner@gmail.com>

RUN apt-get update -y

#Set the working directory to be the home directory
WORKDIR /home/safeuser

# Switch to user account.
USER safeuser
# Prep 'sudo' commands.
#RUN echo 'abcd8765' | sudo -S pwd

# Install Redis. TODO: Make this a separate container.


# Clone the repository
WORKDIR /home/safeuser
RUN git clone https://github.com/Permissionless-Software-Foundation/bch-api
WORKDIR /home/safeuser/bch-api
RUN git checkout ct-new-rate-limits
RUN npm install --silent

# Generate documentation
RUN npm run docs

EXPOSE 3000

COPY start-local-mainnet.sh start-local-mainnet.sh
CMD ["./start-local-mainnet.sh"]
