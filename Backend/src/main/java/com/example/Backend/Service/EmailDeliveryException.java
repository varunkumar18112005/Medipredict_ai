package com.example.Backend.Service;

/** Raised when no configured provider accepts a transactional email. */
public class EmailDeliveryException extends RuntimeException {
    public EmailDeliveryException(String message) {
        super(message);
    }
}
