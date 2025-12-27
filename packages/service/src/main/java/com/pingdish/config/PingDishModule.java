package com.pingdish.config;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.pingdish.accessor.WebSocketAccessor;
import com.pingdish.component.SessionComponent;
import com.pingdish.component.WebSocketComponent;
import com.pingdish.dao.ConnectionDao;
import com.pingdish.dao.SessionDao;
import com.pingdish.dao.TableDao;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

/**
 * Guice module defining dependency bindings for the PingDish service.
 * All dependencies are configured as singletons for Lambda warm start optimization.
 */
public class PingDishModule extends AbstractModule {

    @Provides
    @Singleton
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.create();
    }

    @Provides
    @Singleton
    public TableDao tableDao(DynamoDbClient client) {
        return new TableDao(client);
    }

    @Provides
    @Singleton
    public SessionDao sessionDao(DynamoDbClient client) {
        return new SessionDao(client);
    }

    @Provides
    @Singleton
    public ConnectionDao connectionDao(DynamoDbClient client) {
        return new ConnectionDao(client);
    }

    @Provides
    @Singleton
    public WebSocketAccessor webSocketAccessor(ConnectionDao connectionDao) {
        String wsEndpoint = String.format("https://%s.execute-api.%s.amazonaws.com/prod",
                System.getenv("WS_API_ID"),
                System.getenv("AWS_REGION"));
        return new WebSocketAccessor(connectionDao, wsEndpoint);
    }

    @Provides
    @Singleton
    public SessionComponent sessionComponent(TableDao tableDao, SessionDao sessionDao, WebSocketAccessor wsAccessor) {
        return new SessionComponent(tableDao, sessionDao, wsAccessor);
    }

    @Provides
    @Singleton
    public WebSocketComponent webSocketComponent(ConnectionDao connectionDao) {
        return new WebSocketComponent(connectionDao);
    }
}
