
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class SmartPark {

    static ParkingService service = new ParkingService();

    public static void main(String[] args) throws Exception {

        // Render deployment port
        int port = Integer.parseInt(
            System.getenv().getOrDefault("PORT", "8080")
        );

        HttpServer server = HttpServer.create(
            new InetSocketAddress("0.0.0.0", port), 0
        );

        server.setExecutor(Executors.newCachedThreadPool());

        // Serve frontend files
        server.createContext("/", exchange -> {

            String path = exchange.getRequestURI().getPath();

            if (path.equals("/")) {
                path = "/index.html";
            }

            // Correct folder name: Frontend
            File file = new File("Frontend", path.substring(1));

            if (!file.exists() || !file.isFile()) {
                send(exchange, 404, "File not found", "text/plain");
                return;
            }

            String type = path.endsWith(".css") ? "text/css"
                : path.endsWith(".js") ? "application/javascript"
                : "text/html";

            send(
                exchange,
                200,
                Files.readString(file.toPath()),
                type
            );
        });

        // Park a vehicle
        server.createContext("/park", exchange -> {

            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                send(
                    exchange,
                    405,
                    json("Use POST to park a vehicle."),
                    "application/json"
                );
                return;
            }

            String number = readNumber(exchange);
            String message = service.parkVehicle(number);

            send(exchange, 200, json(message), "application/json");
        });

        // Remove a vehicle
        server.createContext("/remove", exchange -> {

            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                send(
                    exchange,
                    405,
                    json("Use POST to remove a vehicle."),
                    "application/json"
                );
                return;
            }

            String number = readNumber(exchange);
            String message = service.removeVehicle(number);

            send(exchange, 200, json(message), "application/json");
        });

        // Search a currently parked vehicle
        server.createContext("/search", exchange -> {

            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                send(
                    exchange,
                    405,
                    json("Use POST to search for a vehicle."),
                    "application/json"
                );
                return;
            }

            String number = readNumber(exchange);
            String message = service.searchVehicle(number);

            System.out.println(
                "Vehicle search: " +
                (number.isEmpty() ? "(empty number)" : number)
            );

            send(exchange, 200, json(message), "application/json");
        });

        // Get current parking records
        server.createContext("/vehicles", exchange -> {

            StringBuilder result = new StringBuilder();

            result.append("{\"occupied\":")
                  .append(service.getOccupiedSlots())
                  .append(",\"available\":")
                  .append(service.getAvailableSlots())
                  .append(",\"vehicles\":[");

            List<String[]> vehicles = service.getVehicleDetails();

            for (int i = 0; i < vehicles.size(); i++) {

                if (i > 0) {
                    result.append(",");
                }

                result.append("{\"vehicleNumber\":\"")
                      .append(escape(vehicles.get(i)[0]))
                      .append("\",\"entryTime\":\"")
                      .append(escape(vehicles.get(i)[1]))
                      .append("\"}");
            }

            result.append("]}");

            send(
                exchange,
                200,
                result.toString(),
                "application/json"
            );
        });

        server.start();

        System.out.println("SmartPark is running!");
        System.out.println("Server port: " + port);
    }

    // Read vehicle number from JSON request
    static String readNumber(HttpExchange exchange)
            throws IOException {

        String body = new String(
            exchange.getRequestBody().readAllBytes(),
            StandardCharsets.UTF_8
        );

        int start = body.indexOf("\"vehicleNumber\"");

        if (start < 0) {
            return "";
        }

        int colon = body.indexOf(":", start);

        if (colon < 0) {
            return "";
        }

        int first = body.indexOf("\"", colon + 1);

        if (first < 0) {
            return "";
        }

        int last = body.indexOf("\"", first + 1);

        if (last < 0) {
            return "";
        }

        return body.substring(first + 1, last).trim();
    }

    // Convert message into JSON
    static String json(String message) {

        return "{\"message\":\"" + escape(message) + "\"}";
    }

    // Escape characters for JSON responses
    static String escape(String value) {

        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
    }

    // Send HTTP response
    static void send(
        HttpExchange exchange,
        int status,
        String content,
        String type
    ) throws IOException {

        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
            "Content-Type",
            type + "; charset=UTF-8"
        );

        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }
}
