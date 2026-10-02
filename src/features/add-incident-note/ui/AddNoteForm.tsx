import { zodResolver } from '@hookform/resolvers/zod'
import { useId, type KeyboardEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { NOTE_MAX, addNoteInputSchema, type AddNoteInput } from '@/entities/incident'
import { Button, CharacterCount, Field, fieldAria, inputClassName } from '@/shared/ui'
import { useAddIncidentNote } from '../model/use-add-incident-note'

/**
 * Plain-text note composer. Empty and whitespace-only notes are rejected on
 * the client (and again by the server). The text is cleared only after the
 * server confirms, so a failed submission never loses what the user typed.
 */
export function AddNoteForm({ incidentId }: { incidentId: string }) {
  const id = useId()
  const mutation = useAddIncidentNote(incidentId)
  const form = useForm<AddNoteInput>({
    resolver: zodResolver(addNoteInputSchema),
    defaultValues: { message: '' },
  })
  const message = useWatch({ control: form.control, name: 'message' })
  const validationError = form.formState.errors.message?.message
  const submitError = mutation.isError ? "Couldn't add the note. Your text has been kept, so you can try again." : undefined

  const submit = form.handleSubmit(async ({ message: text }) => {
    if (mutation.isPending) return // guard against double submission
    try {
      await mutation.mutateAsync(text)
      form.reset()
    } catch {
      form.setFocus('message')
    }
  })

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void submit()
    }
  }

  const fieldId = `${id}-message`
  const error = validationError ?? submitError

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <Field
        id={fieldId}
        label="Add a note"
        hint="Plain text. Press Ctrl+Enter (⌘+Enter on Mac) to submit."
        error={error}
        aside={<CharacterCount value={message.length} max={NOTE_MAX} />}
      >
        <textarea
          {...form.register('message', { onChange: () => mutation.isError && mutation.reset() })}
          {...fieldAria(fieldId, { error, hint: true })}
          rows={3}
          onKeyDown={onKeyDown}
          placeholder="What did you find or change?"
          className={inputClassName({ invalid: Boolean(error), className: 'resize-y py-2' })}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {mutation.isPending ? 'Adding note…' : 'Add note'}
        </Button>
      </div>
    </form>
  )
}
