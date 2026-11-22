"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { TeamMember } from "@/lib/financial-api";
import { useRecords } from "@/lib/records";
import { documentSchema } from "@/lib/schemas";
import { emptyTeamProfile, teamProfileId, teamProfileSchema, type TeamProfile } from "@/lib/team-profiles";
import { TeamMemberSheet } from "./TeamMemberSheet";

/** Carrega a ficha só quando o Gerente abre um membro: a coleção é restrita a ele no backend. */
export function TeamMemberSheetLoader({ member, onClose, onSaved }: { member: TeamMember; onClose: () => void; onSaved: () => void }) {
  const profiles = useRecords("team-profiles", teamProfileSchema);
  const documents = useRecords("documents", documentSchema);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void teamProfileId(member.email).then((id) => {
      if (!cancelled) setProfileId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [member.email]);

  if (profiles.error) {
    return (
      <Modal title={`Ficha de ${member.name}`} onClose={onClose}>
        <p className="ui-alert ui-alert-error" role="alert">
          {profiles.error}{" "}
          <button type="button" className="ui-link" onClick={() => void profiles.reload()}>
            Tentar de novo
          </button>
        </p>
      </Modal>
    );
  }

  if (!profileId || profiles.loading) {
    return (
      <Modal title={`Ficha de ${member.name}`} onClose={onClose}>
        <div style={{ display: "grid", gap: 10 }} aria-busy="true" role="status" aria-label="Carregando ficha">
          <div className="ui-skeleton" style={{ height: 64 }} />
          <div className="ui-skeleton" style={{ height: 140 }} />
        </div>
      </Modal>
    );
  }

  const profile: TeamProfile = profiles.items.find((item) => item.id === profileId) ?? emptyTeamProfile(profileId, member.email, member.name);

  return (
    <TeamMemberSheet
      member={member}
      profile={profile}
      documents={documents.items}
      onClose={onClose}
      onSave={async (next) => {
        await profiles.save(next);
        onSaved();
      }}
    />
  );
}
