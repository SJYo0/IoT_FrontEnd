package com.iot_sw.iot_web_backend.mqtt;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.IntegrationComponentScan;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import java.util.UUID;

@Configuration
// MqttGateway.java의 @MessagingGateway를 인식
@IntegrationComponentScan(basePackages = "com.iot_sw.iot_web_backend")
public class MqttConfig {

    private static final String BROKER_URL = "tcp://localhost:1883";
    // 브로커에 메세지를 발행하는 주체
    private static final String OUTBOUND_CLIENT_ID = "spring-boot-server-outbound-" + UUID.randomUUID().toString();
    private static final String INBOUND_CLIENT_ID = "spring-boot-server-inbound-" + UUID.randomUUID().toString();
    // MQTT 브로커 연결 설정
    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[] { BROKER_URL });
        options.setCleanSession(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    // 메시지가 나갈 Channel 생성 (MqttGateway.java에서 통로 지정)
    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    // 메시지 발행 핸들러, 발행 채널에 들어오는 메시지 처리 설정
    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound() {
        MqttPahoMessageHandler messageHandler =
                new MqttPahoMessageHandler(OUTBOUND_CLIENT_ID, mqttClientFactory());
        messageHandler.setAsync(true);
        messageHandler.setDefaultTopic("default/topic"); // 디폴트 토픽
        return messageHandler;
    }

    // 메시지를 읽어올 Channel 생성
    @Bean
    public MessageChannel mqttInboundChannel() {
        return new DirectChannel();
    }

    // 구독 어댑터 설정
    @Bean
    public MessageProducer inbound() {
        // "spring-boot-server-inbound" 클라이언트가 특정 토픽들을 구독
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(INBOUND_CLIENT_ID, mqttClientFactory(),
                        "provisioning/request", "gateway/+/telemetry", "devices/status");

        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1); // 메시지 전달 보장 수준 설정
        adapter.setOutputChannel(mqttInboundChannel()); // 빨아들인 메시지를 위의 통로로 던짐
        return adapter;
    }
}
