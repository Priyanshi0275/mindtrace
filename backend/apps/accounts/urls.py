from django.urls import path

from .views import AccountDeleteView, AccountExportView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("export/", AccountExportView.as_view(), name="account-export"),
    path("account/", AccountDeleteView.as_view(), name="account-delete"),
]
