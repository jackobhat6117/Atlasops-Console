import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState, type KeyboardEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  DESCRIPTION_MAX,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  TITLE_MAX,
  type Incident,
} from '@/entities/incident'
import { useServices } from '@/entities/service'
import { useUsers } from '@/entities/user'
import { getErrorMessage, isApiError } from '@/shared/api'
import { paths } from '@/shared/config'
import { useUnsavedChangesGuard } from '@/shared/lib'
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
import { FormSection } from './FormSection'
import { IncidentPreview } from './IncidentPreview'
import { SeverityOption } from './SeverityOption'
import { StatusOption } from './StatusOption'

const FIELD_LABELS: Record<CreateIncidentField, string> = {
  title: 'Title',
  description: 'Description',
  severity: 'Severity',
  service: 'Service',
  status: 'Initial status',
  assigneeId: 'Assignee',
}

/**
 * Create-incident form: three short sections (what's happening, impact,
 * response) next to a sticky live preview holding the primary action.
 *
 * - Validates on submit, then on change, with the shared Zod schema.
 * - Errors appear next to each field and in a summary; focus moves to the first invalid field.
 * - Server field errors (400) map onto the same fields. Other failures show an alert.
 *   Entered data is always kept.
 * - Double submission is blocked while a request is in flight. Ctrl/⌘+Enter submits.
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
  const values = useWatch({ control: form.control })

  const guard = useUnsavedChangesGuard(isDirty && !mutation.isSuccess)
  const isBusy = isSubmitting || mutation.isPending

  // Radio groups are focused through their first option (or the selected one).
  const focusField = (name: CreateIncidentField) => {
    if (name === 'severity' || name === 'status') {
      const options: readonly string[] = name === 'severity' ? INCIDENT_SEVERITIES : INCIDENT_STATUSES
      const selected = form.getValues(name)
      document.getElementById(`${ids[name]}-${selected || options[0]}`)?.focus()
    } else {
      form.setFocus(name)
    }
  }

  const submit = form.handleSubmit(
    async (formValues) => {
      if (mutation.isPending) return // second click or shortcut while saving
      setServerError(null)
      try {
        const incident = await mutation.mutateAsync(toCreateIncidentInput(formValues))
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
    },
    (fieldErrors) => {
      // RHF focuses text inputs itself; radio groups need help.
      const first = CREATE_INCIDENT_FIELDS.find((name) => fieldErrors[name])
      if (first === 'severity' || first === 'status') focusField(first)
    },
  )

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void submit()
    }
  }

  const errorItems = CREATE_INCIDENT_FIELDS.flatMap((name) => {
    const message = errors[name]?.message
    return message ? [{ id: ids[name], message: `${FIELD_LABELS[name]}: ${message}`, onSelect: () => focusField(name) }] : []
  })

  const assignee = users.data?.find((user) => user.id === values.assigneeId) ?? null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form
        id={formId}
        onSubmit={submit}
        onKeyDown={onKeyDown}
        noValidate
        aria-label="New incident"
        className="flex min-w-0 flex-col gap-5"
      >
        {errorItems.length > 0 && submitCount > 0 && (
          <ErrorSummary
            key={submitCount}
            title={`Fix ${errorItems.length === 1 ? 'this problem' : `these ${errorItems.length} problems`} to create the incident:`}
            items={errorItems}
          />
        )}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-danger-soft p-3 text-sm text-danger"
          >
            <AlertOctagonIcon size={16} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">Couldn't create the incident.</span> {serverError} Your input has been
              kept.
            </p>
          </div>
        )}

        <FormSection step={1} title="What's happening?" description="Summarize the problem so responders can triage it at a glance.">
          <Field
            id={ids.title}
            label="Title"
            required
            error={errors.title?.message}
            hint="e.g. “Checkout latency increased in EU”"
            aside={<CharacterCount value={values.title?.length ?? 0} max={TITLE_MAX} />}
          >
            <input
              {...form.register('title')}
              {...fieldAria(ids.title, { error: errors.title?.message, hint: true })}
              aria-required="true"
              autoComplete="off"
              placeholder="Short, specific summary"
              className={inputClassName({ invalid: Boolean(errors.title), className: 'h-11 text-base' })}
            />
          </Field>

          <Field
            id={ids.description}
            label="Description"
            required
            error={errors.description?.message}
            hint="What is happening, who is affected, and since when."
            aside={<CharacterCount value={values.description?.length ?? 0} max={DESCRIPTION_MAX} />}
          >
            <textarea
              {...form.register('description')}
              {...fieldAria(ids.description, { error: errors.description?.message, hint: true })}
              aria-required="true"
              rows={5}
              placeholder="Symptoms, scope of impact, first signals, links to dashboards…"
              className={inputClassName({ invalid: Boolean(errors.description), className: 'resize-y py-2.5' })}
            />
          </Field>
        </FormSection>

        <FormSection step={2} title="Impact" description="How bad is it, and where?">
          <fieldset aria-describedby={errors.severity ? `${ids.severity}-error` : undefined} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-fg">
              Severity
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
            </legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {INCIDENT_SEVERITIES.map((severity) => (
                <SeverityOption
                  key={severity}
                  id={`${ids.severity}-${severity}`}
                  severity={severity}
                  invalid={Boolean(errors.severity)}
                  {...form.register('severity')}
                />
              ))}
            </div>
            <FieldError id={`${ids.severity}-error`} message={errors.severity?.message} />
          </fieldset>

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
              className="w-full sm:max-w-sm"
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
        </FormSection>

        <FormSection step={3} title="Response" description="Where the incident starts, and who owns it.">
          <fieldset aria-describedby={errors.status ? `${ids.status}-error` : undefined} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-fg">
              Initial status
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1 ring-1 ring-line sm:grid-cols-4">
              {INCIDENT_STATUSES.map((status) => (
                <StatusOption key={status} id={`${ids.status}-${status}`} status={status} {...form.register('status')} />
              ))}
            </div>
            <FieldError id={`${ids.status}-error`} message={errors.status?.message} />
          </fieldset>

          <Field
            id={ids.assigneeId}
            label="Assignee"
            optional
            error={errors.assigneeId?.message}
            hint={users.isError ? undefined : 'You can assign someone later.'}
          >
            <Select
              {...form.register('assigneeId')}
              {...fieldAria(ids.assigneeId, { error: errors.assigneeId?.message, hint: !users.isError })}
              disabled={users.isPending}
              className="w-full sm:max-w-sm"
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
        </FormSection>
      </form>

      <aside aria-label="Incident preview and actions" className="flex flex-col gap-4 lg:sticky lg:top-24">
        <IncidentPreview
          title={values.title ?? ''}
          severity={values.severity}
          status={values.status}
          service={values.service ?? ''}
          assigneeName={assignee?.name ?? null}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" form={formId} variant="primary" loading={isBusy} className="h-10 w-full">
            {isBusy ? 'Creating incident…' : 'Create incident'}
          </Button>
          <Link to={paths.incidents} className={buttonClassName({ className: 'h-10 w-full' })}>
            Cancel
          </Link>
          <p className="text-center text-xs text-subtle">
            Press <kbd className="rounded border border-line bg-surface px-1 font-sans">Ctrl</kbd> /{' '}
            <kbd className="rounded border border-line bg-surface px-1 font-sans">⌘</kbd> +{' '}
            <kbd className="rounded border border-line bg-surface px-1 font-sans">Enter</kbd> to create
          </p>
        </div>
      </aside>

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
    </div>
  )
}
