FROM christroutner/ct-base-ubuntu
MAINTAINER Chris Troutner <chris.troutner@gmail.com>

RUN apt-get update -y

#Set the working directory to be the home directory
WORKDIR /home/safeuser

# Switch to user account.
USER safeuser
# Prep 'sudo' commands.
#RUN echo 'abcd8765' | sudo -S pwd

# Clone the Bitcore repository
WORKDIR /home/safeuser
RUN git clone https://github.com/christroutner/bch-api
WORKDIR /home/safeuser/bch-api
RUN npm install


EXPOSE 3000

COPY start-local-mainnet start-local-mainnet
CMD ["./start-local-mainnet"]
