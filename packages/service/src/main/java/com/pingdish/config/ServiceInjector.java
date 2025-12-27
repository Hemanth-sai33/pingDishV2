package com.pingdish.config;

import com.google.inject.Guice;
import com.google.inject.Injector;

/**
 * Singleton holder for the Guice dependency injector.
 * Provides centralized access to injected dependencies for Lambda handlers.
 */
public final class ServiceInjector {
    private static final Injector INJECTOR = Guice.createInjector(new PingDishModule());

    private ServiceInjector() {}

    /**
     * Retrieves an instance of the specified class from the injector.
     *
     * @param <T> the type of instance to retrieve
     * @param clazz the class of the instance
     * @return the injected instance
     */
    public static <T> T getInstance(Class<T> clazz) {
        return INJECTOR.getInstance(clazz);
    }
}
