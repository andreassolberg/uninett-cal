#!/usr/bin/env bash
set -e # halt script on error
#app=$(jq -r .name nova.config.json)
app=calendarapp
hostnameapp=_NA_
oldapp="${app}-old"
domain="cal.uninett.no"

echo "Ready to deploy updated version of ${hostnameapp}.${domain} (app ${app})"

. ~/cf-login.sh
cf target -o system -s prod

#cp app/etc/config.template.js app/etc/config.js

npm install
node_modules/grunt-cli/bin/grunt build
#npm prepublish

if cf app "${app}" |egrep -q '#.*running'
then
    first='n'
    if cf app "${oldapp}"
    then
        cf delete -f "${oldapp}"
    fi
    cf rename "${app}" "${oldapp}"
else
    first='y'
fi
cf push "${app}" -k 384M -m 128M -i 1 -b https://github.com/cloudfoundry-community/staticfile-buildpack.git
cf map-route "${app}" "${domain}"

if [ "${first}" = 'n' ]
then
    cf unmap-route "${oldapp}" "${domain}" 
    cf stop "${oldapp}"
fi

echo "Done."