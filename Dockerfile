FROM maven:3.9.9-eclipse-temurin-21 AS build

ARG MODULE=app/backend-main

WORKDIR /app

COPY pom.xml .
COPY app ./app

RUN mvn clean package \
    -pl ${MODULE} \
    -am \
    -DskipTests

FROM eclipse-temurin:21-jre

ARG MODULE=app/backend-main

WORKDIR /app

COPY --from=build /app/${MODULE}/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]