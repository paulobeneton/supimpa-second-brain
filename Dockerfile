FROM node:24-alpine AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM php:8.4-apache AS app
RUN apt-get update && apt-get install -y --no-install-recommends libzip-dev libicu-dev libonig-dev unzip \
    && docker-php-ext-install pdo_mysql mbstring intl zip opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY backend/ ./
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache
COPY --from=frontend /build/dist/ ./public/
COPY deploy/apache.conf /etc/apache2/sites-available/000-default.conf
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr
EXPOSE 80