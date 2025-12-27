package com.pingdish.model.response;

public record PingResponse(boolean success, int pingCount, String error, Integer remainingSeconds) {}
