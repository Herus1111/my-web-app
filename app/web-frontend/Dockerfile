FROM node:20-alpine AS build
WORKDIR /app

COPY app/web-frontend/package*.json ./
RUN npm ci

COPY app/web-frontend/ ./
ARG REACT_APP_API_URL=http://localhost:8080/growdent
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY app/web-frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
