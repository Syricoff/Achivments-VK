FROM nginx:1.27-alpine

# Артефакт собирается локально/в CI и коммитится в mini-app/build.
# Сервер не запускает Node.js, Vite и не расходует память на сборку.
COPY build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
