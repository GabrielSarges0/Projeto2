package br.org.fundacaomanuelcruz.projeto2.store;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/records/{collection}")
public class RecordController {

    private final RecordService service;

    public RecordController(RecordService service) {
        this.service = service;
    }

    @GetMapping
    public List<RecordResponse> list(@PathVariable String collection) {
        return service.list(collection);
    }

    @GetMapping("/{id}")
    public RecordResponse get(@PathVariable String collection, @PathVariable String id) {
        return service.get(collection, id);
    }

    @PutMapping("/{id}")
    public RecordResponse upsert(@PathVariable String collection, @PathVariable String id, @RequestBody JsonNode body) {
        return service.upsert(collection, id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String collection, @PathVariable String id) {
        service.delete(collection, id);
        return ResponseEntity.noContent().build();
    }
}
