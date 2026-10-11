package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "reminder")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reminder_text", nullable = false)
    private String text;

    @Column(nullable = false)
    private boolean done;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected Reminder() {
    }

    public Reminder(String text) {
        this.text = text;
        this.done = false;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getText() {
        return text;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

