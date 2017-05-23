FROM nginx

WORKDIR /srv/www

RUN apt-get update && apt-get install -y curl build-essential  git \
	&& rm -rf /var/lib/apt/lists/*
RUN curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
RUN chmod a+x ./nodesource_setup.sh
RUN ./nodesource_setup.sh
RUN apt-get install nodejs

COPY default.conf /etc/nginx/conf.d/default.conf
COPY package.json package.json
RUN npm install
RUN npm install -g grunt
COPY . /srv/www/
RUN grunt build



# COPY .bowerrc /srv/www/.bowerrc
# COPY _config.yml /srv/www/_config.yml
# COPY package.json /srv/www/package.json
# COPY bower.json /srv/www/bower.json

# RUN npm install
# RUN node_modules/bower/bin/bower install --config.interactive=false -p --allow-root
# RUN jekyll build
# RUN rm -rf /srv/www/dist/bower_components/uninett-theme/
# RUN cd /srv/www/dist/bower_components/ && git clone https://github.com/andreassolberg/uninett-bootstrap-theme.git uninett-theme && cd uninett-theme && /srv/www/node_modules/bower/bin/bower install --allow-root
# RUN curl -o /srv/www/dist/bower_components/uninett-theme/fonts/colfaxLight.woff http://mal.uninett.no/uninett-theme/fonts/colfaxLight.woff \
# 	&& curl -o /srv/www/dist/bower_components/uninett-theme/fonts/colfaxMedium.woff http://mal.uninett.no/uninett-theme/fonts/colfaxMedium.woff \
# 	&& curl -o /srv/www/dist/bower_components/uninett-theme/fonts/colfaxRegular.woff http://mal.uninett.no/uninett-theme/fonts/colfaxRegular.woff \
# 	&& curl -o /srv/www/dist/bower_components/uninett-theme/fonts/colfaxThin.woff http://mal.uninett.no/uninett-theme/fonts/colfaxThin.woff \
# 	&& curl -o /srv/www/dist/bower_components/uninett-theme/fonts/colfaxRegularItalic.woff http://mal.uninett.no/uninett-theme/fonts/colfaxRegularItalic.woff

EXPOSE 80
