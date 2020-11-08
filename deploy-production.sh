# Triggers a webhook to update the staging server at staging.fullstack.cash.

#!/bin/bash
#echo $DEPLOY_SECRET

# This if statement will only deploy on Jenkins when its testing the master branch.
echo "-->$GIT_BRANCH<--"
if [[ $GIT_BRANCH == *"master"* ]]
  then

    echo "Deploying to production...."

    export DATA="{\"ref\":\"$DEPLOY_SECRET\"}"

    #echo $DATA

    curl -X POST http://fullstack.cash:9000/hooks/bch-api-mainnet -H "Content-Type: application/json" -d $DATA
    curl -X POST http://fullstack.cash:9000/hooks/bch-api-testnet -H "Content-Type: application/json" -d $DATA
    curl -X POST http://$FREE_SERVER:9000/hooks/bch-api-testnet -H "Content-Type: application/json" -d $DATA
    curl -X POST http://$FREE_SERVER:9000/hooks/bch-api-mainnet -H "Content-Type: application/json" -d $DATA

    echo "...Finished deploying to production."

  else
    echo "Not master, so not deploying."
fi
