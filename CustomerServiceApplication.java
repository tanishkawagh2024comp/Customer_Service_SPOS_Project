package com.example.customerservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Customer Service Center - Round Robin scheduling simulator. */
@SpringBootApplication
public class CustomerServiceApplication {

    public static void main(String[] args) throws IOException {
        // The SQLite file lives in ./data; make sure the folder exists before the datasource starts.
        Files.createDirectories(Path.of("data"));
        SpringApplication.run(CustomerServiceApplication.class, args);
    }
}
