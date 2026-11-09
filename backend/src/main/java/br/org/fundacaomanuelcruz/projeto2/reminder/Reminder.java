package br.org.fundacaomanuelcruz.projeto2.reminder;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "reminder")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reminder_text", nullable = false)
    private String title;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReminderPriority priority;

    @Column(length = 120)
    private String responsible;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private boolean done;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    protected Reminder() {
    }

    public Reminder(ReminderDetails details) {
        apply(details);
        this.done = false;
    }

    public void apply(ReminderDetails details) {
        this.title = details.title();
        this.dueDate = details.dueDate();
        this.category = details.category();
        this.priority = details.priority();
        this.responsible = details.responsible();
        this.description = details.description();
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public ReminderCategory getCategory() {
        return category;
    }

    public ReminderPriority getPriority() {
        return priority;
    }

    public String getResponsible() {
        return responsible;
    }

    public String getDescription() {
        return description;
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

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public record ReminderDetails(
            String title,
            LocalDate dueDate,
            ReminderCategory category,
            ReminderPriority priority,
            String responsible,
            String description) {
    }
}
