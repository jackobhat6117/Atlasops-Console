import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  DESCRIPTION_MAX,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  STATUS_LABELS,
  SeverityBadge,
  TITLE_MAX,
  type Incident,
  type IncidentSeverity,
} from '@/entities/incident'
import { useServices } from '@/entities/service'
import { useUsers } from '@/entities/user'
import { getErrorMessage, isApiError } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn, useUnsavedChangesGuard } from '@/shared/lib'
import {
  AlertOctagonIcon,
  Button,
  buttonClassName,
  CharacterCount,
  ConfirmDialog,
  ErrorSummary,
  Field,
  FieldError,
  fieldAria,
  inputClassName,
  Select,
} from '@/shared/ui'
import {
  CREATE_INCIDENT_FIELDS,
  createIncidentFormSchema,
  toCreateIncidentInput,
  type CreateIncidentField,
  type CreateIncidentFormInput,
  type CreateIncidentFormValues,
} from '../model/form-schema'
import { useCreateIncident } from '../model/use-create-incident'

const SEVERITY_HINTS: Record<IncidentSeverity, string> = {
  critical: 'Outage or data loss affecting customers',
  high: 'Significant degradation for many users',
  medium: 'Partial impact, or a workaround exists',
  low: 'Minor issue, little or no customer impact',
}

const FIELD_LABELS: Record<CreateIncidentField, string> = {
  title: 'Title',
  description: 'Description',
  severity: 'Severity',
  service: 'Service',
  status: 'Initial status',
  assigneeId: 'Assignee',
}

/**
 * Create-incident form.
 * - Validates on submit, then on change, with the shared Zod schema.
 * - Errors appear next to each field and in a summary; focus moves to the first invalid field.
 * - Server field errors (400) map onto the same fields. Other failures show a banner.
 *   Entered data is always kept.
 * - Double submission is blocked while a request is in flight.
 * - Leaving with unsaved input asks for confirmation.
 */
export function CreateIncidentForm({ onCreated }: { onCreated: (incident: Incident) => void }) {
  const formId = useId()
  const ids = Object.fromEntries(CREATE_INCIDENT_FIELDS.map((name) => [name, `${formId}-${name}`])) as Record<
    CreateIncidentField,
    string
  >

  const services = useServices()
  const users = useUsers()
  const mutation = useCreateIncident()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateIncidentFormInput, unknown, CreateIncidentFormValues>({
    resolver: zodResolver(createIncidentFormSchema),
    defaultValues: { title: '', description: '', service: '', status: 'triggered', assigneeId: '' },
  })
  const { errors, isDirty, isSubmitting, submitCount } = form.formState
  const [title, description] = useWatch({ control: form.control, name: ['title', 'description'] })

  const guard = useUnsavedChangesGuard(isDirty && !mutation.isSuccess)
  const isBusy = isSubmitting || mutation.isPending

  const focusField = (name: CreateIncidentField) => {
    if (name === 'severity') document.getElementById(`${ids.severity}-${INCIDENT_SEVERITIES[0]}`)?.focus()
    else form.setFocus(name)
  }

  const submit = form.handleSubmit(async (values) => {
    if (mutation.isPending) return // second click or Enter while saving
    setServerError(null)
    try {
      const incident = await mutation.mutateAsync(toCreateIncidentInput(values))
      guard.allowNextNavigation()
      onCreated(incident)
    } catch (error) {
      const fieldErrors = isApiError(error) && error.status === 400 ? error.fieldErrors : {}
      const known = CREATE_INCIDENT_FIELDS.filter((name) => fieldErrors[name]?.length)
      if (known.length > 0) {
        for (const name of known) form.setError(name, { type: 'server', message: fieldErrors[name][0] })
        focusField(known[0])
      } else {
        setServerError(getErrorMessage(error))
      }
    }
  })

  const errorItems = CREATE_INCIDENT_FIELDS.flatMap((name) => {
    const message = errors[name]?.message
    return message ? [{ id: ids[name], message: `${FIELD_LABELS[name]}: ${message}`, onSelect: () => focusField(name) }] : []
  })

  return (
    <>
      <form onSubmit={submit} noValidate aria-describedby={`${formId}-required`} className="flex flex-col gap-6">
        <p id={`${formId}-required`} className="text-sm text-muted">
          Fields marked <span className="text-danger">*</span> are required.
        </p>

        {errorItems.length > 0 && submitCount > 0 && (
          <ErrorSummary
            key={submitCount}
            title={`Fix ${errorItems.length === 1 ? 'this problem' : `these ${errorItems.length} problems`} to create the incident:`}
            items={errorItems}
          />
        )}
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-danger-soft p-3 text-sm text-danger">
            <AlertOctagonIcon size={16} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">Couldn't create the incident.</span> {serverError} Your input has been
              kept.
            </p>
          </div>
        )}

        <Field
          id={ids.title}
          label="Title"
          required
          error={errors.title?.message}
          hint="A short summary engineers will recognise, e.g. “Checkout latency increased”."
          aside={<CharacterCount value={title.length} max={TITLE_MAX} />}
        >
          <input
            {...form.register('title')}
            {...fieldAria(ids.title, { error: errors.title?.message, hint: true })}
            aria-required="true"
            autoComplete="off"
            className={inputClassName({ invalid: Boolean(errors.title), className: 'h-9' })}
          />
        </Field>

        <Field
          id={ids.description}
          label="Description"
          required
          error={errors.description?.message}
          hint="What is happening, who is affected, and since when."
          aside={<CharacterCount value={description.length} max={DESCRIPTION_MAX} />}
        >
          <textarea
            {...form.register('description')}
            {...fieldAria(ids.description, { error: errors.description?.message, hint: true })}
            aria-required="true"
            rows={5}
            className={inputClassName({ invalid: Boolean(errors.description), className: 'resize-y py-2' })}
          />
        </Field>

        <fieldset aria-describedby={errors.severity ? `${ids.severity}-error` : undefined} className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-fg">
            Severity
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INCIDENT_SEVERITIES.map((severity) => (
              <label
                key={severity}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-md border bg-surface p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                  errors.severity ? 'border-danger' : 'border-line-strong',
                )}
              >
                <input
                  type="radio"
                  value={severity}
                  {...form.register('severity')}
                  id={`${ids.severity}-${severity}`}
                  aria-invalid={errors.severity ? true : undefined}
                  className="mt-0.5 size-4 accent-[var(--color-accent)] focus:outline-none"
                />
                <span className="flex flex-col gap-1">
                  <SeverityBadge severity={severity} className="self-start" />
                  <span className="text-xs text-muted">{SEVERITY_HINTS[severity]}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id={`${ids.severity}-error`} message={errors.severity?.message} />
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id={ids.service}
            label="Service"
            required
            error={errors.service?.message}
            hint={services.isError ? undefined : 'The affected system.'}
          >
            <Select
              {...form.register('service')}
              {...fieldAria(ids.service, { error: errors.service?.message, hint: !services.isError })}
              aria-required="true"
              disabled={services.isPending}
              className="w-full"
            >
              <option value="">{services.isPending ? 'Loading services…' : 'Select a service'}</option>
              {services.data?.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </Select>
            {services.isError && (
              <p className="text-xs text-danger">
                Couldn't load services.{' '}
                <button type="button" onClick={() => services.refetch()} className="font-medium underline">
                  Retry
                </button>
              </p>
            )}
          </Field>

          <Field id={ids.status} label="Initial status" required error={errors.status?.message}>
            <Select
              {...form.register('status')}
              {...fieldAria(ids.status, { error: errors.status?.message })}
              aria-required="true"
              className="w-full"
            >
              {INCIDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id={ids.assigneeId} label="Assignee" optional error={errors.assigneeId?.message}>
            <Select
              {...form.register('assigneeId')}
              {...fieldAria(ids.assigneeId, { error: errors.assigneeId?.message })}
              disabled={users.isPending}
              className="w-full"
            >
              <option value="">{users.isPending ? 'Loading users…' : 'Unassigned'}</option>
              {users.data?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
            {users.isError && (
              <p className="text-xs text-danger">
                Couldn't load users; you can assign someone later.{' '}
                <button type="button" onClick={() => users.refetch()} className="font-medium underline">
                  Retry
                </button>
              </p>
            )}
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Link to={paths.incidents} className={buttonClassName()}>
            Cancel
          </Link>
          <Button type="submit" variant="primary" loading={isBusy}>
            {isBusy ? 'Creating incident…' : 'Create incident'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={guard.blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && guard.blocker.state === 'blocked') guard.blocker.reset()
        }}
        title="Discard this incident?"
        description="You have unsaved changes. If you leave this page, they will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => guard.blocker.state === 'blocked' && guard.blocker.proceed()}
      />
    </>
  )
}
