package com.codementor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CodeMentorApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodeMentorApplication.class, args);
    }
}
