package com.sentinel.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${sentinel.kafka.topics.location}")
    private String locationTopic;

    @Value("${sentinel.kafka.topics.motion}")
    private String motionTopic;

    @Value("${sentinel.kafka.topics.alerts}")
    private String alertsTopic;

    @Bean
    public NewTopic locationTopic() {
        return TopicBuilder.name(locationTopic)
                .partitions(3)
                .replicas(1)
                .config("retention.ms", "86400000")  // 24 hours
                .build();
    }

    @Bean
    public NewTopic motionTopic() {
        return TopicBuilder.name(motionTopic)
                .partitions(3)
                .replicas(1)
                .config("retention.ms", "21600000")  // 6 hours
                .build();
    }

    @Bean
    public NewTopic alertsTopic() {
        return TopicBuilder.name(alertsTopic)
                .partitions(1)
                .replicas(1)
                .config("retention.ms", "259200000") // 72 hours
                .build();
    }
}
