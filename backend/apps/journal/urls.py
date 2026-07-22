from rest_framework.routers import DefaultRouter

from .views import JournalEntryViewSet, ReflectViewSet, TrendsView

router = DefaultRouter()
router.register("entries", JournalEntryViewSet, basename="entries")
router.register("trends", TrendsView, basename="trends")
router.register("reflect", ReflectViewSet, basename="reflect")

urlpatterns = router.urls
