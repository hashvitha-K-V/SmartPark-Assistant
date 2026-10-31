
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY Backend/*.java ./

COPY Frontend ./Frontend

RUN mkdir -p out && javac --add-modules jdk.httpserver -d out *.java

EXPOSE 8080

CMD ["java", "--add-modules", "jdk.httpserver", "-cp", "out", "SmartPark"]
