package com.pingdish.model.response;

import com.pingdish.model.Session;

public record ScanTableResponse(Session session, String error) {}
