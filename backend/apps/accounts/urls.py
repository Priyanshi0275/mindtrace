from django.urls import path

from .views import (
    AccountDeleteView,
    AccountExportView,
    MeView,
    MoodCheckinView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("mood-checkin/", MoodCheckinView.as_view(), name="mood-checkin"),
    path("export/", AccountExportView.as_view(), name="account-export"),
    path("account/", AccountDeleteView.as_view(), name="account-delete"),
]
