package com.takypok.shopservice.model.entity;

import com.takypok.core.model.IdEntity;
import com.takypok.core.model.authentication.User;

public class Product <T extends ProductInformation> extends IdEntity {
    private String summary;
    private User reporter;
    private User assignee;
    private T detail;
}
