/**
 * Actions clinicien sur une recommandation (open-loop, validation humaine).
 *
 * Transitions autorisées (gardées côté serveur) :
 *   pending  → approved | rejected | modified
 *   modified → approved | rejected
 * La sécurité (termes interdits / dose) est revalidée côté serveur à chaque
 * écriture : un message non conforme renvoie une erreur affichée ici.
 */
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/Text';
import { Button, Gap } from '@/components/Button';
import { AlertBanner } from '@/components/Banners';
import { ApiError } from '@/services/api/client';
import {
  approveRecommendation,
  rejectRecommendation,
  modifyRecommendation,
} from '@/services/api/recommendations';
import type { RecommendationPublic } from '@/types/api';
import { palette, radius, spacing } from '@/theme/theme';

export function RecommendationActions({
  rec,
  onChanged,
}: {
  rec: RecommendationPublic;
  onChanged?: () => void;
}) {
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(rec.message);
  const [error, setError] = useState<string | null>(null);

  const final = rec.status === 'approved' || rec.status === 'rejected';
  const canModify = rec.status === 'pending';

  const onErr = (e: unknown) =>
    setError(e instanceof ApiError ? e.userMessage : "Action impossible.");

  const approveM = useMutation({
    mutationFn: () => approveRecommendation(rec.id, note || undefined),
    onError: onErr,
    onSuccess: () => {
      setError(null);
      onChanged?.();
    },
  });
  const rejectM = useMutation({
    mutationFn: () => rejectRecommendation(rec.id, note || undefined),
    onError: onErr,
    onSuccess: () => {
      setError(null);
      onChanged?.();
    },
  });
  const modifyM = useMutation({
    mutationFn: () => modifyRecommendation(rec.id, message, note || undefined),
    onError: onErr,
    onSuccess: () => {
      setError(null);
      setEditing(false);
      onChanged?.();
    },
  });

  const busy = approveM.isPending || rejectM.isPending || modifyM.isPending;

  if (final) {
    return (
      <Text variant="caption" tone="muted">
        {rec.status === 'approved' ? 'Validée' : 'Rejetée'}
        {rec.review_note ? ` · note : ${rec.review_note}` : ''}
      </Text>
    );
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: palette.text,
    backgroundColor: palette.surface,
    fontSize: 14,
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {error ? <AlertBanner level="danger" message={error} /> : null}

      {editing ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="caption" tone="secondary">
            Texte de la recommandation (revalidé côté serveur)
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            accessibilityLabel="Texte de la recommandation"
            style={[inputStyle, { minHeight: 72 }]}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Enregistrer la modification"
              loading={modifyM.isPending}
              disabled={busy}
              onPress={() => modifyM.mutate()}
            />
            <Button label="Annuler" variant="ghost" onPress={() => setEditing(false)} />
          </View>
        </View>
      ) : null}

      <Text variant="caption" tone="secondary">
        Note de décision (optionnelle)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Motif / contexte…"
        placeholderTextColor={palette.textMuted}
        accessibilityLabel="Note de décision"
        style={inputStyle}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Button
          label="Approuver"
          loading={approveM.isPending}
          disabled={busy}
          onPress={() => approveM.mutate()}
        />
        <Button
          label="Rejeter"
          variant="danger"
          loading={rejectM.isPending}
          disabled={busy}
          onPress={() => rejectM.mutate()}
        />
        {canModify && !editing ? (
          <Button label="Modifier" variant="secondary" disabled={busy} onPress={() => setEditing(true)} />
        ) : null}
      </View>
      <Gap size={spacing.xs} />
    </View>
  );
}
