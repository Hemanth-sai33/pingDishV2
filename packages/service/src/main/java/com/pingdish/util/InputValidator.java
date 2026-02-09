package com.pingdish.util;

/**
 * [FIX 6.4] Server-side input validation for restaurant registration.
 */
public final class InputValidator {

    private InputValidator() {}

    public static void validateRestaurantId(String id) {
        if (id == null || id.length() < 3 || id.length() > 50) {
            throw new IllegalArgumentException("restaurantId must be 3-50 characters");
        }
        if (!id.matches("^[a-z0-9][a-z0-9-]*[a-z0-9]$")) {
            throw new IllegalArgumentException("restaurantId must be lowercase alphanumeric with hyphens, cannot start/end with hyphen");
        }
    }

    public static void validateRestaurantName(String name) {
        if (name == null || name.trim().isEmpty() || name.length() > 100) {
            throw new IllegalArgumentException("restaurantName must be 1-100 characters");
        }
        if (!name.matches("^[a-zA-Z0-9\\s\\-.'&]+$")) {
            throw new IllegalArgumentException("restaurantName contains invalid characters");
        }
    }

    public static void validateEmail(String email) {
        if (email == null || !email.matches("^[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email address");
        }
    }

    public static void validateNumberOfTables(int tables) {
        if (tables < 1 || tables > 500) {
            throw new IllegalArgumentException("numberOfTables must be 1-500");
        }
    }
}
