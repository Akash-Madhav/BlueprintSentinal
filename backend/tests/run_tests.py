"""
Standard unittest runner for BluePrint Sentinel test suite.
Can be executed with standard python without external test runners.
"""
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.tests.test_layer3_rules import (
    test_egress_01_passing,
    test_egress_01_failing_isolated_room,
    test_egress_01_failing_too_many_intermediate_rooms,
    test_egress_02_passing,
    test_egress_02_failing,
    test_elec_01_passing,
    test_elec_01_failing_shared_panel,
    test_elec_02_overload,
    test_net_01_spof,
    test_layer3_orchestration,
)
from backend.tests.test_orchestrator import (
    test_full_pipeline_single_plan,
    test_full_pipeline_cross_reference_mode,
)


class TestLayer3Rules(unittest.TestCase):
    def test_01_egress_passing(self):
        test_egress_01_passing()

    def test_02_egress_isolated(self):
        test_egress_01_failing_isolated_room()

    def test_03_egress_intermediate(self):
        test_egress_01_failing_too_many_intermediate_rooms()

    def test_04_egress_02_passing(self):
        test_egress_02_passing()

    def test_05_egress_02_failing(self):
        test_egress_02_failing()

    def test_06_elec_01_passing(self):
        test_elec_01_passing()

    def test_07_elec_01_failing(self):
        test_elec_01_failing_shared_panel()

    def test_08_elec_02_overload(self):
        test_elec_02_overload()

    def test_09_net_01_spof(self):
        test_net_01_spof()

    def test_10_orchestration(self):
        test_layer3_orchestration()


class TestFullPipeline(unittest.TestCase):
    def test_pipeline_single(self):
        test_full_pipeline_single_plan()

    def test_pipeline_cross_ref(self):
        test_full_pipeline_cross_reference_mode()


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestLayer3Rules)
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestFullPipeline))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
