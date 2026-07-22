from django.contrib import admin

from .models import CrisisFlag, EmotionTag, JournalEntry, TrendSnapshot


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    # Deliberately NOT showing raw_text in list_display -- admins should not
    # be casually browsing journal content (SRS section 2: system/admin role
    # only ever sees aggregate, anonymized metrics, never individual content).
    list_display = ("id", "user", "entry_date", "created_at")
    list_filter = ("entry_date",)


@admin.register(CrisisFlag)
class CrisisFlagAdmin(admin.ModelAdmin):
    list_display = ("id", "entry", "triggered_at", "resolved")


admin.site.register(EmotionTag)
admin.site.register(TrendSnapshot)
