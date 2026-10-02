FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY app/backend-main/pom.xml ./app/backend-main/pom.xml
COPY app/backend-simulator/pom.xml ./app/backend-simulator/pom.xml
COPY app/web-frontend/pom.xml ./app/web-frontend/pom.xml
COPY app ./app

RUN mvn -q -pl app/backend-main -am -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /workspace/app/backend-main/target/backend-main-1.0.0-SNAPSHOT.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
