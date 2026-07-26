package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A document or policy — either an uploaded file, inline text, or both (at least one required, see
 * DB CHECK). No authorSub: unlike NewsPost, any admin may edit any document (these are org-official
 * records, not personal posts), so ownership isn't a query need — createdBy/modifiedBy (inherited
 * audit jsonb) already records who touched it.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentPost extends IdEntity {
  private String category;
  private String title;
  private String version;
  private String content;
  private String fileUrl;
  private String fileName;
  private Long fileSize;
  private DocumentStatus status = DocumentStatus.ACTIVE;
}
